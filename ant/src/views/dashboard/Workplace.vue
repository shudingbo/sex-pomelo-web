<template>
  <div>

    <a-tabs defaultActiveKey="sysG">
      <template slot="tabBarExtraContent">
        <a-button icon="plus" @click="dlgAddVisable=true;dlgAddEdit=true;" type="primary" size="small" title="Add Server">Add</a-button>
        <a-button icon="plus-square" style="margin-left:6px;" @click="dlgAddBatchVisable=true" type="dashed" size="small" title="Batch Add Server">Add Batch</a-button>
      </template>
      <a-tab-pane tab="Graphics" key="sysG" forceRender>
        <a-row>
          <a-col :span="20">
            <div>
              <div>
                <span>Layout: </span>
                <a-select size="small" style="width: 100px" :defaultValue="'radial'"  @change="handleLayoutChange" >
                  <a-select-option v-for="(v,k) in layout" :key="k" :value="k">{{k}}</a-select-option>
                </a-select>
                <span> Type Node: </span>
                <a-switch checkedChildren="show" unCheckedChildren="hide" defaultUnChecked @change="handleShowChange"/>
                <span> ServerStatus: </span>
                <a-radio-group :value="show.status" @change="handleShowStatusChange" size="small">
                  <a-radio-button value="run">Run</a-radio-button>
                  <a-radio-button value="all">All</a-radio-button>
                  <a-radio-button value="stop">Stop</a-radio-button>
                </a-radio-group>
                <span> System : </span>
                <a-select size="small" style="width: 100px" :defaultValue="''" showSearch :filterOption="filterOption" @change="handleSysChange" >
                  <a-select-option key="-1" :value="''">All</a-select-option>
                  <a-select-option v-for="i in systems" :key="i" :value="i">{{i}}</a-select-option>
                </a-select>
                <span> ServerType: </span>
                <a-select size="small" style="width: 120px" :defaultValue="''" showSearch :filterOption="filterOption" @change="handleServerTypeChange" >
                  <a-select-option key="-1" :value="''">All</a-select-option>
                  <a-select-option v-for="i in serverTypes" :key="i" :value="i">{{i}}</a-select-option>
                </a-select>
                <!--<a-button type="primary" size="small">Primary</a-button>-->
              </div>
              <div id="container" />
            </div>
          </a-col>
          <a-col :span="4">
            <div v-if="curSelNode !== null">
              <h4 style="textAlign:center">{{(curSelNode.lv==='sys')?curSelNode.ip : curSelNode.serverId}}</h4>
              <div style="margin:6px;" v-if="curSelNode.lv==='node'">
                <a-popconfirm
                :title="`${(curSelNode.runStatus===true)?'Stop':'Start'} ${curSelNode.serverId}?`"
                @confirm="() => (curSelNode.runStatus===true)?stopServer(curSelNode):startServer(curSelNode)"
                >
                  <a-button type="primary" size="small" shape="circle"
                  :icon="(curSelNode.runStatus===true)?'poweroff':'caret-right'"
                  :title="(curSelNode.runStatus===true)?'stop':'start'"
                  ></a-button>
                </a-popconfirm>
                <a-popconfirm style="margin-left:6px;"  v-if="curSelNode.runStatus===false" :title="`Delete ${curSelNode.serverId}?`" @confirm="() => deleteServer(curSelNode)">
                  <a-button type="danger" size="small" shape="circle" icon="close">
                  </a-button>
                </a-popconfirm>
                <a-button style="margin-left:6px;" v-if="curSelNode.runStatus===false" type="dashed" size="small" shape="circle" icon="edit" @click="showEditDlg(curSelNode)"></a-button>
              </div>
              <ul style="font-size:10px">
                <li v-for="(val,key) in curSelNode" :key="key">
                  <span v-if="typeof(val) !== 'object'">
                    <template v-if="typeof(val) === 'number'">
                      <template v-if="Number.isInteger(val)">
                        <a-tag>{{key}}</a-tag>{{val}}
                      </template>
                      <template v-else>
                        <a-tag>{{key}}</a-tag>{{val.toFixed(2)}}
                      </template>
                    </template>
                    <template v-else>
                      <a-tag>{{key}}</a-tag>{{val}}
                    </template>
                  </span>
                </li>
              </ul>
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>
      <a-tab-pane tab="Table" key="sysT">
        <a-table :columns="sysColumns" :dataSource="sysMapArr" class="components-table-demo-nested" rowKey="hostname" size="small">
            <a-badge slot="slHost" slot-scope="text,record" :count="record.nodes.length" :numberStyle="{backgroundColor: '#52c41a'}">
              <a-tag href="javascript:;">{{text}}</a-tag>
            </a-badge>
          <a-table
            slot="expandedRowRender"
            slot-scope="record"
            :columns="nodeColums"
            :dataSource="record.nodes"
            :pagination="false"
            rowKey="serverId"
            size="small"
          >
            <template slot="slSerId" slot-scope="text,record">
              <router-link :to="{path:'/dashboard/serverinfo',query:record}" tag="a" target="_blank">
                <a-tag>{{text}}</a-tag>
              </router-link>
            </template>
          </a-table>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <a-modal :visible="dlgAddVisable" title="Add Server" @ok="onHandlerDlgOk"  @cancel="()=>{dlgAddVisable=false}">
      <a-form-item  label="serverId" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model='addSer.serverId' placeholder="Server Id" :disabled="!dlgAddEdit"></a-input>
      </a-form-item>
      <a-form-item  label="serverType" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model='addSer.serverType' placeholder="Server type" :disabled="!dlgAddEdit"></a-input>
      </a-form-item>
      <a-form-item  label="host" :label-col="formTailLayout.labelCol"  :wrapper-col="formTailLayout.wrapperCol">
        <a-input v-model="addSer.host" placeholder="IP address"></a-input>
      </a-form-item>
      <a-form-item  label="port" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input-number v-model="addSer.port" :min='1000'>
        </a-input-number>
      </a-form-item>
      <a-form-item label="frontend" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-switch :value="addSer.frontend" checkedChildren="frontend" unCheckedChildren="backend" :disabled="!dlgAddEdit"></a-switch>
      </a-form-item>
      <a-form-item v-if="addSer.frontend" label="clientPort" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input-number v-model="addSer.clientPort" :min='1000'>
        </a-input-number>
      </a-form-item>
    </a-modal>
    <a-modal :visible="dlgAddBatchVisable" title="Batch Add Server" @ok="addServerBatch"  @cancel="()=>{dlgAddBatchVisable=false}">
      <a-textarea v-model="txtBatchAdd" :autosize="{ minRows: 3,maxRows:20 }"
        placeholder="cp servers.json in text"
      >
      </a-textarea>
    </a-modal>
  </div>
</template>

<script>
import { axios } from '@/utils/request';
import G6 from '@antv/g6';

const sysColumns = [
  { title: 'host', dataIndex: 'hostname', scopedSlots: { customRender: 'slHost' } },
  { title: 'IP', dataIndex: 'ip' },
  { title: 'Time', dataIndex: 'Time' },
  {
    title: 'CPU',
    children: [
      { title: 'user', dataIndex: 'cpu_user' },
      { title: 'system', dataIndex: 'cpu_system' },
      { title: 'idle', dataIndex: 'cpu_idle' }
    ]
  },
  {
    title: 'IO',
    children: [
      { title: 'tps', dataIndex: 'tps', sorter: (a, b) => a.tps - b.tps },
      { title: 'kb_read', dataIndex: 'kb_read' },
      { title: 'kb_wrtn', dataIndex: 'kb_wrtn' }
    ]
  },
  {
    title: 'Memory(MB)',
    children: [
      { title: 'total', dataIndex: 'totalmem', sorter: (a, b) => a.totalmem - b.totalmem },
      { title: 'free', dataIndex: 'freemem', sorter: (a, b) => a.freemem - b.freemem },
      { title: 'f/t', dataIndex: 'free/total' }
    ]
  }
];

const nodeColums = [
  { title: 'serverId', dataIndex: 'serverId', scopedSlots: { customRender: 'slSerId' }, sorter: (a, b) => a.serverId.localeCompare(b.serverId) },
  { title: 'port', dataIndex: 'port' },
  { title: 'cpuAvg', dataIndex: 'cpuAvg', sorter: (a, b) => a.cpuAvg - b.cpuAvg },
  { title: 'memAvg', dataIndex: 'memAvg', sorter: (a, b) => a.memAvg - b.memAvg },
  {
    title: 'mem(MB)',
    children: [
      { title: 'vsz', dataIndex: 'vsz', sorter: (a, b) => a.vsz - b.vsz },
      { title: 'rss', dataIndex: 'rss', sorter: (a, b) => a.rss - b.rss },
      { title: 'usr', dataIndex: 'usr', sorter: (a, b) => a.usr - b.usr },
      { title: 'sys', dataIndex: 'sys', sorter: (a, b) => a.sys - b.sys },
      { title: 'heapUsed', dataIndex: 'heapUsed', sorter: (a, b) => a.heapUsed - b.heapUsed }
    ]
  },
  { title: 'uptime(m)', dataIndex: 'uptime', sorter: (a, b) => a.uptime - b.uptime }
];

let ipHideTimer;

const TREE_NODE = 'tree-node';

const SOFAROUTER_TEXT_CLASS = 'sofarouter-text-class';
const SOFAROUTER_RECT_CLASS = 'sofarouter-rect-class';

// const CANVAS_WIDTH = document.getElementById('container').scrollWidth;
// const CANVAS_HEIGHT = document.getElementById('container').scrollHeight;

const getNodeConfig = function getNodeConfig (node) {
  const cfgPurple = { basicColor: '#722ED1', fontColor: '#722ED1', borderColor: '#722ED1', bgColor: '#F6EDFC' };
  const cfgGray = { basicColor: '#E3E6E8', fontColor: 'rgba(0,0,0,0.85)', borderColor: '#E3E6E8', bgColor: '#F7F9FA' };
  const cfgBlue = { basicColor: '#2F54EB', fontColor: '#2F54EB', borderColor: '#2F54EB', bgColor: '#F3F6FD' };
  const cfgYellow = { basicColor: '#FA8C16', fontColor: '#FA8C16', borderColor: '#FA8C16', bgColor: '#FCF4E3' };
  const cfgGreen = { basicColor: '#52C41A', fontColor: '#52C41A', borderColor: '#52C41A', bgColor: '#F4FCEB' };
  const cfgRed = { basicColor: '#F5222D', fontColor: '#FFF', borderColor: '#F5222D', bgColor: '#E66A6C' };

  switch (node.lv) {
  case 'sys':
    return (node.orgi['free/total'] < 0.4 || node.orgi.cpu_idle < 50) ? cfgYellow : cfgBlue;
  case 'node':
    if (node.orgi.runStatus === true) { // node is run
      return (node.orgi.frontend) ? cfgPurple : cfgGreen;
    } else {
      return cfgGray;
    }
  default:
    return cfgGray;
  }
};

const COLLAPSE_ICON = function COLLAPSE_ICON (x, y, r) {
  return [[ 'M', x - r, y ], [ 'a', r, r, 0, 1, 0, r * 2, 0 ], [ 'a', r, r, 0, 1, 0, -r * 2, 0 ], [ 'M', x - r + 4, y ], [ 'L', x - r + 2 * r - 4, y ]];
};
const EXPAND_ICON = function EXPAND_ICON (x, y, r) {
  return [[ 'M', x - r, y ], [ 'a', r, r, 0, 1, 0, r * 2, 0 ], [ 'a', r, r, 0, 1, 0, -r * 2, 0 ], [ 'M', x - r + 4, y ], [ 'L', x - r + 2 * r - 4, y ], [ 'M', x - r + r, y - r + 4 ], [ 'L', x, y + r - 4 ]];
};

let selectedItem;

let gGraph = null;

/* 精简节点和复杂节点共用的一些方法 */
const nodeBasicMethod = {
  createNodeBox: function createNodeBox (group, config, width, height, isRoot) {
    /* 最外面的大矩形 */
    const container = group.addShape('rect', {
      attrs: {
        x: 0,
        y: 0,
        width: width - 16,
        height
      },
      name: 'container-rect-shape'
    });
    if (!isRoot) {
      /* 左边的小圆点 */
      group.addShape('circle', {
        attrs: {
          x: 3,
          y: height / 2,
          r: 6,
          fill: config.basicColor
        },
        name: 'left-dot-shape'
      });
    }
    /* 矩形 */
    group.addShape('rect', {
      attrs: {
        x: 3,
        y: 0,
        width: width - 19,
        height,
        fill: config.bgColor,
        stroke: config.borderColor,
        radius: 2
      },
      name: 'rect-shape'
    });

    /* 左边的粗线 */
    group.addShape('rect', {
      attrs: {
        x: 3,
        y: 0,
        width: 3,
        height,
        fill: config.basicColor,
        radius: 1.5
      },
      name: 'left-border-shape'
    });
    return container;
  },
  /* 生成树上的 marker */
  createNodeMarker: function createNodeMarker (group, collapsed, x, y) {
    group.addShape('circle', {
      attrs: {
        x,
        y,
        r: 16,
        fill: 'rgba(47, 84, 235, 0.05)',
        opacity: 0,
        zIndex: -2
      },
      name: 'collapse-icon-bg'
    });
    group.addShape('marker', {
      attrs: {
        x,
        y,
        r: 10,
        symbol: collapsed ? EXPAND_ICON : COLLAPSE_ICON,
        stroke: 'rgba(0,0,0,0.25)',
        fill: 'rgba(0,0,0,0)',
        lineWidth: 1,
        cursor: 'pointer'
      },
      name: 'collapse-icon'
    });
  },
  afterDraw: function afterDraw (cfg, group) {
    /* 操作 marker 的背景色显示隐藏 */
    const icon = group.find(element => element.get('name') === 'collapse-icon');
    if (icon) {
      const bg = group.find(element => element.get('name') === 'collapse-icon-bg');
      icon.on('mouseenter', function () {
        bg.attr('opacity', 1);
        gGraph.get('canvas').draw();
      });
      icon.on('mouseleave', function () {
        bg.attr('opacity', 0);
        gGraph.get('canvas').draw();
      });
    }

    const rect = group.find(element => element.get('name') === 'rect-shape');
    if (rect) {
      const bg = group.find(element => element.get('name') === 'collapse-icon-bg');
      rect.on('mouseenter', function () {
        rect.attr('opacity', 0.6);
        rect.attr('lineWidth', 8);
        gGraph.get('canvas').draw();
      });
      rect.on('mouseleave', function () {
        rect.attr('opacity', 1);
        rect.attr('lineWidth', 2);
        gGraph.get('canvas').draw();
      });
    }
  },
  setState: function setState (name, value, item) {
    const hasOpacityClass = [ 'collapse-icon-bg' ];
    const group = item.getContainer();
    const childrens = group.get('children');
    gGraph.setAutoPaint(false);
    if (name === 'emptiness') {
      if (value) {
        childrens.forEach((shape) => {
          if (hasOpacityClass.indexOf(shape.get('name')) > -1) {
            return;
          }
          shape.attr('opacity', 0.4);
        });
      } else {
        childrens.forEach((shape) => {
          if (hasOpacityClass.indexOf(shape.get('name')) > -1) {
            return;
          }
          shape.attr('opacity', 1);
        });
      }
    }
    gGraph.setAutoPaint(true);
  }
};

/* 精简节点和复杂节点共用的一些方法 */
const nodeCircleMethod = {
  createNodeBox: function createNodeBox (group, config, radius, isRoot) {
    /* 最外面的大矩形 */
    const container = group.addShape('circle', {
      attrs: {
        x: 0,
        y: 0,
        r: radius
      },
      name: 'container-rect-shape'
    });
    /* 矩形 */
    group.addShape('circle', {
      attrs: {
        x: 3,
        y: 0,
        r: radius,
        fill: config.bgColor,
        stroke: config.borderColor,
        radius: 2
      },
      name: 'rect-shape'
    });

    return container;
  },
  /* 生成树上的 marker */
  createNodeMarker: function createNodeMarker (group, collapsed, x, y) {
    group.addShape('circle', {
      attrs: {
        x,
        y,
        r: 24,
        fill: 'rgba(47, 84, 235, 0.05)',
        opacity: 0,
        zIndex: -2
      },
      name: 'collapse-icon-bg'
    });
    group.addShape('marker', {
      attrs: {
        x,
        y,
        r: 18,
        symbol: collapsed ? EXPAND_ICON : COLLAPSE_ICON,
        stroke: 'rgba(0,0,0,0.25)',
        fill: 'rgba(0,0,0,0.1)',
        lineWidth: 1,
        cursor: 'pointer'
      },
      name: 'collapse-icon'
    });
  },
  afterDraw: function afterDraw (cfg, group) {
    /* 操作 marker 的背景色显示隐藏 */
    const icon = group.find(element => element.get('name') === 'collapse-icon');
    if (icon) {
      const bg = group.find(element => element.get('name') === 'collapse-icon-bg');
      icon.on('mouseenter', function () {
        bg.attr('opacity', 1);
        gGraph.get('canvas').draw();
      });
      icon.on('mouseleave', function () {
        bg.attr('opacity', 0);
        gGraph.get('canvas').draw();
      });
    }
  },
  setState: function setState (name, value, item) {
    const hasOpacityClass = [ 'collapse-icon-bg' ];
    const group = item.getContainer();
    const childrens = group.get('children');
    gGraph.setAutoPaint(false);
    if (name === 'emptiness') {
      if (value) {
        childrens.forEach((shape) => {
          if (hasOpacityClass.indexOf(shape.get('name')) > -1) {
            return;
          }
          shape.attr('opacity', 0.4);
        });
      } else {
        childrens.forEach((shape) => {
          if (hasOpacityClass.indexOf(shape.get('name')) > -1) {
            return;
          }
          shape.attr('opacity', 1);
        });
      }
    }
    gGraph.setAutoPaint(true);
  }
};

/* 复杂节点 */
G6.registerNode(TREE_NODE, {
  drawShape: function drawShape (cfg, group) {
    const config = getNodeConfig(cfg);
    const isRoot = cfg.type === 'root';
    const data = cfg;
    const { nodeError } = data;
    /* 最外面的大矩形 */
    let container = null;
    let isVirNode = !(data.lv === 'sys' || data.lv === 'node');

    if (isVirNode) {
      container = nodeCircleMethod.createNodeBox(group, config, 24, isRoot);
    } else {
      container = nodeBasicMethod.createNodeBox(group, config, 243, 64, isRoot);
    }

    if (data.dataType !== 'root') {
      /* 上边的 type */
      if (isVirNode) {
        group.addShape('text', {
          attrs: {
            text: data.id + `(${data.cnt})`,
            x: -12,
            y: -34,
            fontSize: 14,
            textAlign: 'left',
            textBaseline: 'middle',
            fontWeight: 700,
            fill: config.fontColor
          },
          name: 'type-text-shape'
        });
      } else {
        group.addShape('text', {
          attrs: {
            text: data.lv,
            x: 3,
            y: -10,
            fontSize: 12,
            textAlign: 'left',
            textBaseline: 'middle',
            fill: 'rgba(0,0,0,0.65)'
          },
          name: 'type-text-shape'
        });
      }
    }

    if (!isVirNode) {
      /* name */
      group.addShape('text', {
        attrs: {
          text: data.id + (data.cnt ? ` ( ${data.cnt} )` : ''), // data.id,
          x: 19,
          y: 19,
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'left',
          textBaseline: 'middle',
          fill: config.fontColor,
          cursor: 'pointer'
        },
        name: 'name-text-shape'
      });

      /* 下面的文字 */
      group.addShape('text', {
        attrs: {
          text: data.keyInfo,
          x: 19,
          y: 45,
          fontSize: 14,
          textAlign: 'left',
          textBaseline: 'middle',
          fill: config.fontColor,
          cursor: 'pointer'
        },
        name: 'bottom-text-shape'
      });
    }

    const hasChildren = cfg.children && cfg.children.length > 0;
    if (hasChildren) {
      if (isVirNode) {
        nodeCircleMethod.createNodeMarker(group, cfg.collapsed, 4, 0);
      } else {
        nodeBasicMethod.createNodeMarker(group, cfg.collapsed, 236, 32);
      }
    }
    return container;
  },
  afterDraw: nodeBasicMethod.afterDraw,
  setState: nodeBasicMethod.setState
}, 'single-node');
/* 是否显示 sofarouter，通过透明度来控制 */
G6.registerEdge('tree-edge', {
  draw: function draw (cfg, group) {
    const targetNode = cfg.targetNode.getModel();
    const edgeError = !!targetNode.edgeError;

    const { startPoint, endPoint } = cfg;
    const controlPoints = this.getControlPoints(cfg);
    let points = [ startPoint ]; // 添加起始点
    // 添加控制点
    if (controlPoints) {
      points = points.concat(controlPoints);
    }
    // 添加结束点
    points.push(endPoint);
    const path = this.getPath(points);

    group.addShape('path', {
      attrs: {
        path,
        lineWidth: 12,
        stroke: edgeError ? 'rgba(245,34,45,0.05)' : 'rgba(47,84,235,0.05)',
        opacity: 0,
        zIndex: 0
      },
      name: 'line-bg'
    });
    const keyShape = group.addShape('path', {
      attrs: {
        path,
        lineWidth: 1,
        stroke: edgeError ? '#FF7875' : 'rgba(0,0,0,0.25)',
        zIndex: 1,
        lineAppendWidth: 12
      },
      edgeError: !!edgeError,
      name: 'path-shape'
    });

    /* 连接线的中间点 */
    const centerPoint = {
      x: startPoint.x + (endPoint.x - startPoint.x) / 2,
      y: startPoint.y + (endPoint.y - startPoint.y) / 2
    };

    return keyShape;
  },

  /* 操作 线 的背景色显示隐藏 */
  afterDraw: function afterDraw (cfg, group) {
    /* 背景色 */
    const lineBG = group.get('children')[0]; // 顺序根据 draw 时确定
    /* 线条 */
    const line = group.get('children')[1];
    line.on('mouseenter', function () {
      lineBG.attr('opacity', '1');
      /* 线条如果在没有错误的情况下，在 hover 时候，是需要变成蓝色的 */
      if (!line.get('edgeError')) {
        line.attr('stroke', '#2F54EB');
      }
      gGraph.get('canvas').draw();
    });
    line.on('mouseleave', function () {
      lineBG.attr('opacity', '0');
      if (!line.get('edgeError')) {
        line.attr('stroke', 'rgba(0,0,0,0.25)');
      }
      gGraph.get('canvas').draw();
    });
  },
  setState: function setState (name, value, item) {
    const group = item.getContainer();
    const childrens = group.get('children');
    gGraph.setAutoPaint(true);
    if (name === 'emptiness') {
      if (value) {
        childrens.forEach(function (shape) {
          if (shape.get('name') === 'line-bg') {
            return;
          }
          shape.attr('opacity', 0.4);
        });
      } else {
        childrens.forEach(function (shape) {
          if (shape.get('name') === 'line-bg') {
            return;
          }
          shape.attr('opacity', 1);
        });
      }
    }
    gGraph.setAutoPaint(true);
  },
  update: null
}, 'cubic-horizontal');

const formItemLayout = {
  labelCol: { span: 7 },
  wrapperCol: { span: 8 }
};
const formTailLayout = {
  labelCol: { span: 7 },
  wrapperCol: { span: 8, offset: 4 }
};

export default {
  name: 'Workplace',
  components: {

  },
  data () {
    return {
      sysColumns,
      nodeColums,
      servers: [],
      filter: [''],
      graph: null,
      show: {
        serverTypeNode: false,
        status: 'run', // all,显示所有服务器; run,只显示运行状态; stop,只显示停止状态
        serverType: '',
        sys: ''
      },
      formItemLayout,
      formTailLayout,
      dlgAddVisable: false,
      dlgAddEdit: true, // true 表示是添加; false表示更新
      addSer: {
        serverId: 'aaa-1',
        serverType: 'aaa',
        host: '127.0.0.1',
        port: 10000,
        frontend: false,
        clientPort: 0
      },
      curSelNode: null,
      dlgAddBatchVisable: false,
      txtBatchAdd: '',
      layout: {
        'radial': {
          type: 'compactBox', // 'compactBox','dendrogram'
          direction: 'LR',
          getId: d => d.id,
          getWidth: () => 243,
          getVGap: () => 24,
          getHGap: () => 50,
          radial: true
        },
        'rect': {
          type: 'compactBox', // 'compactBox','dendrogram'
          direction: 'LR',
          getId: d => d.id,
          getWidth: () => 243,
          getVGap: () => 24,
          getHGap: () => 50,
          radial: false
        }
      }
    };
  },
  computed: {
    sysMapArr () {
      let o = this.$store.getters.sexpSystemMap;

      let ret = [];
      for (let sys in o) {
        let it = o[sys];
        let nodes = [];
        for (let i in it.nodes) {
          let n = Object.assign({}, it.nodes[i]);
          n.vsz = (n.vsz / (1024 * 1024)).toFixed(2);
          n.rss = (n.rss / (1024 * 1024)).toFixed(2);
          nodes.push(n);
        }

        let nO = Object.assign({}, it);
        nO.totalmem = parseInt(nO.totalmem / (1024 * 1024));
        nO.freemem = parseInt(nO.freemem / (1024 * 1024));
        nO['free/total'] = nO['free/total'].toFixed(2);

        let time = new Date(nO.Time);
        nO.Time = time.Format('MM-dd hh:mm');
        nO.nodes = nodes;
        ret.push(nO);
      }

      return ret;
    },
    gData () {
      let data = { id: 'sex',
        children: [],
        descr: '',
        cnt: 1,
        lv: 'root',
        keyInfo: 'sex-pomelo'
      };
      let o = this.$store.getters.sexpSystemMap;
      let showStatus = this.show.status;

      for (let sys in o) {
        let it = o[sys];
        if (this.show.sys.length > 0 && this.show.sys !== it.ip) {
          continue;
        }

        let free = parseInt((it.freemem / 1024 / 1024));
        let rat = it['free/total'].toFixed(2);
        let msg = `mem ${free}M (${rat}) cpu ${it.cpu_idle}`;
        let nSys = { id: it.ip,
          descr: msg,
          cnt: Object.keys(it.nodes).length,
          lv: 'sys',
          ip: it.ip,
          keyInfo: msg,
          orgi: it
        };

        let types = {};
        for (let i in it.nodes) {
          let v = it.nodes[i];

          let msg = `up ${parseFloat(v.uptime).toFixed(0)}m`;
          let hasPort = false;
          if (v.port !== undefined) {
            msg += ` port ${v.port}`;
            hasPort = true;
          }
          if (v.clientPort !== undefined && v.clientPort > 0) {
            msg += hasPort ? ` ${v.clientPort}` : ` clientPort ${v.clientPort}`;
          }

          let node = { id: v.serverId,
            descr: msg,
            lv: 'node',
            keyInfo: msg,
            orgi: v
          };

          if (showStatus === 'run' && v.runStatus === false) {
            continue;
          } else if (showStatus === 'stop' && v.runStatus === true) {
            continue;
          }

          if (this.show.serverType.length > 0 && this.show.serverType !== v.serverType) {
            continue;
          }

          if (types[v.serverType] === undefined) {
            types[v.serverType] = { id: v.serverType,
              descr: '',
              children: [node],
              lv: 'type',
              cnt: 1,
              keyInfo: '' };
          } else {
            types[v.serverType].children.push(node);
            types[v.serverType].cnt++;
          }
        }

        let nodes = [];
        let serverTypeNode = this.show.serverTypeNode;
        for (let i in types) {
          if (serverTypeNode) {
            nodes.push(types[i]);
          } else {
            for (let node of types[i].children) {
              nodes.push(node);
            }
          }
        }

        nSys.children = nodes;
        data.children.push(nSys);
      }
      return data;
    },
    serverTypes () {
      let serverTypes = new Set();
      let servers = this.$store.getters.sexpServers;
      for (let key in servers) {
        serverTypes.add(servers[key].serverType);
      }

      return [...serverTypes];
    },
    systems () {
      let o = this.$store.getters.sexpSystemMap;
      let ret = [];
      for (let sys in o) {
        ret.push(`${o[sys].ip}`);
      }
      return ret;
    }
  },
  created () {
    this.setSexpContext('all');
    this.getServiceList();
  },
  mounted () {
    this.createGraphics();
  },
  methods: {
    async getServiceList () {
      let servers = this.$store.getters.sexpServers;
      for (let key in servers) {
        this.servers.push(servers[key]);
      }
    },
    createGraphics () {
      const width = document.getElementById('container').scrollWidth;
      const height = document.getElementById('container').scrollHeight || 560;
      let self = this;
      const graph = new G6.TreeGraph({
        container: 'container',
        width,
        height,
        zoom: 1,
        fitView: true,
        modes: {
          default: [{
            type: 'collapse-expand',
            shouldUpdate: function shouldUpdate (e) {
              /* 点击 node 禁止展开收缩 */
              if (e.target.get('name') !== 'collapse-icon') {
                return false;
              }
              return true;
            },
            onChange: function onChange (item, collapsed) {
              selectedItem = item;
              const icon = item.get('group').find(element => element.get('name') === 'collapse-icon');

              if (collapsed) {
                icon.attr('symbol', EXPAND_ICON);
              } else {
                icon.attr('symbol', COLLAPSE_ICON);
              }
            },
            animate: {
              callback: function callback () {
                graph.focusItem(selectedItem);
              }
            }
          },
          {
            type: 'tooltip',
            formatText: function (data, target) {
              // console.log('target:', target);
              let a = '<div style="padding: 8px 6px;"><ul>';

              if (data.lv === 'sys') {
                ['Time', 'hostname'].forEach((v, i) => {
                  a += `<li><b>${v}</b>: ${data.orgi[v]}</li>`;
                });

                return a + '</ul></div>';
              } else if (data.lv === 'node') {
                ['time', 'uptime'].forEach((v, i) => {
                  a += `<li><b>${v}</b>: ${data.orgi[v]}</li>`;
                });

                return a + '</ul></div>';
              } else {
                return `<div style="display:none">${data.id}</div>`;
              }
            }
          },
          'drag-canvas', 'zoom-canvas' ]
        },
        defaultNode: {
          type: TREE_NODE,
          anchorPoints: [[ 0, 0.5 ], [ 1, 0.5 ]]
        },
        defaultEdge: {
          type: 'tree-edge',
          style: {
            stroke: '#A3B1BF'
          }
        },
        layout: self.layout.radial
      });

      graph.on('beforepaint', () => {
        const topLeft = graph.getPointByCanvas(0, 0);
        const bottomRight = graph.getPointByCanvas(1000, 600);
        graph.getNodes().forEach(node => {
          const model = node.getModel();
          if (model.x < topLeft.x - 200 || model.x > bottomRight.x || model.y < topLeft.y || model.y > bottomRight.y) {
            node.getContainer().hide();
          } else {
            node.getContainer().show();
          }
        });
        const edges = graph.getEdges();
        edges.forEach(edge => {
          const sourceNode = edge.get('sourceNode');
          const targetNode = edge.get('targetNode');
          if (!sourceNode.get('visible') && !targetNode.get('visible')) {
            edge.hide();
          } else {
            edge.show();
          }
        });
      });

      graph.on('node:click', function (event) {
        const { item } = event;
        const shape = event.target;
        let data = item._cfg.model;

        self.showNodeDetail(data.lv, data.id);
        // if (shape.get('className') === INNER_CIRCLE_CLASS) {
        //   // 如果点击是发生在节点里面的小圆上，则更新对应的label
        //   graph.updateItem(item, {
        //     label: '点击了圆',
        //     labelCfg: {
        //       style: {
        //         fill: '#003a8c',
        //         fontSize: 16
        //       }
        //     }
        //   });
        // }
      });
      /// /////
      this.graph = graph;
      gGraph = graph;
      // this.renderGraphics();
      this.graph.data(this.gData);
      this.graph.render();
      this.graph.fitView();
    },
    showNodeDetail (dataType, id) {
      let curSelInfo = null;
      if (dataType === 'sys') {
        curSelInfo = this.$store.getters.sexpSystem(id);
      } else if (dataType === 'node') {
        curSelInfo = this.$store.getters.sexpNode(id);
      }
      if (curSelInfo) {
        curSelInfo.lv = dataType;
      }
      console.log('---curSelInfo:', curSelInfo);
      this.curSelNode = curSelInfo;
    },
    handleShowChange (checked) {
      this.show.serverTypeNode = checked;
      this.renderGraphics();
    },
    handleShowStatusChange (e) {
      this.show.status = e.target.value;
      this.renderGraphics();
    },
    handleLayoutChange (layout) {
      this.graph.updateLayout(this.layout[layout]);
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    handleServerTypeChange (value) {
      this.show.serverType = value;
      this.renderGraphics();
    },
    handleSysChange (value) {
      this.show.sys = value;
      this.renderGraphics();
    },
    async addServer () {
      let cfg = this.addSer;
      if (typeof (cfg.serverId) !== 'string' || cfg.serverId.length < 3) {
        this.$message.warn('serverId error');
        return;
      }

      if (typeof (cfg.serverType) !== 'string' || cfg.serverType.length < 2) {
        this.$message.warn('serverType error');
        return;
      }

      if (cfg.serverId.indexOf(cfg.serverType) === -1) {
        this.$message.warn('serverId must include serverType string. <serverType>-<some str>');
        return;
      }

      if (typeof (cfg.host) !== 'string' || cfg.host.length < 7) {
        this.$message.warn('host error');
        return;
      }

      let curServers = this.$store.getters.sexpServers;
      if (curServers[cfg.serverId] !== undefined) {
        this.$message.warn(`Server ${cfg.serverId} has exits!`);
        return;
      }

      const resp = await axios({
        url: '/regServer',
        method: 'post',
        data: cfg
      });

      if (resp.status === 'success') {
        await this.$store.dispatch('AddServer', cfg);
        this.renderGraphics();
        this.dlgAddVisable = false;
      }

      this.$message[resp.status](resp.message);
    },
    renderGraphics (render = true) {
      let zoom = this.graph.getZoom();
      this.graph.changeData(this.gData);
      let x = parseInt(this.graph.cfg.width / 2);
      let y = parseInt(this.graph.cfg.height / 2);
      this.graph.zoomTo(zoom, { x, y });
    },
    async addServerBatch () {
      let cont = this.txtBatchAdd;
      let addServers = {};
      try {
        let servers = JSON.parse(cont);
        let hasServers = this.$store.getters.sexpServers;
        let production = {};
        for (let env in servers) {
          if (env === 'production') {
            production = servers[env];
            continue;
          }

          for (let type in servers[env]) {
            for (let ser of servers[env][type]) {
              if (hasServers[ser.id] === undefined) {
                let { id: serverId, host, port, clientPort, frontend } = ser;
                addServers[ser.id] = {
                  serverId, serverType: type, host, port, clientPort, frontend
                };
              }
            }
          }
        }

        for (let type in production) {
          for (let ser of production[type]) {
            if (hasServers[ser.id] === undefined) {
              let { id: serverId, host, port, clientPort, frontend } = ser;
              addServers[ser.id] = {
                serverId, serverType: type, host, port, clientPort, frontend
              };
            }
          }
        }
      } catch (err) {
        this.$message.warn(err);
        return;
      }

      if (Object.keys(addServers).length === 0) {
        this.$message.warn('No Server should be add!');
        return;
      }

      const resp = await axios({
        url: '/regServerBatch',
        method: 'post',
        data: addServers
      });

      if (resp.status === 'success') {
        let cfgs = [];

        for (let it in resp.data) {
          cfgs.push(JSON.parse(resp.data[it]));
        }
        await this.$store.dispatch('AddServer', cfgs);
        this.renderGraphics();
        this.dlgAddBatchVisable = false;
      }

      this.$message[resp.status](resp.message);
    },
    async stopServer (ser) {
      console.log('stop ', ser);

      this.$store.dispatch('StopServer', ser.serverId);
      this.renderGraphics();
    },
    async startServer (ser) {
      console.log('start ', ser);

      this.$store.dispatch('StartServer', ser.serverId);
      this.renderGraphics();
    },
    async deleteServer (ser) {
      let ret = await this.$store.dispatch('DeleteServer', ser.serverId);
      if (ret.status === 'success') {
        this.curSelNode = null;
        this.renderGraphics(false);
      }

      this.$message[ret.status](ret.message);
    },
    showEditDlg (ser) {
      this.dlgAddEdit = false;

      let { serverId, serverType, host, port, frontend, clientPort } = ser;
      this.addSer.serverId = serverId;
      this.addSer.serverType = serverType;
      this.addSer.host = host;
      this.addSer.port = port;
      this.addSer.frontend = frontend;
      this.addSer.clientPort = clientPort;

      this.dlgAddVisable = true;
    },
    async editServer () {
      let newCfg = this.addSer;
      this.$store.dispatch('UpdateServer', newCfg);
      this.renderGraphics();
    },
    async onHandlerDlgOk () {
      if (this.dlgAddEdit) {
        this.addServer();
      } else {
        this.editServer();
      }
    }

  }
};
</script>

<style>
.g6-tooltip {
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    font-size: 12px;
    color: #545454;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
  }

li{ list-style: none;}
ul{margin:0px;padding:0px}

</style>
