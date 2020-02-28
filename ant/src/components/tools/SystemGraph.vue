<template>
  <div style="height:100%">
    <a-row>
      <a-col :span="20">
        <div>
          <div>
            <span>Layout </span>
            <a-select size="small" style="width: 100px" v-model="show.layout"  @change="handleLayoutChange" >
              <a-select-option v-for="(v,k) in layout" :key="k" :value="k">{{k}}</a-select-option>
            </a-select>
            <span> Type Node </span>
            <a-switch checkedChildren="show" unCheckedChildren="hide" v-model="show.serverTypeNode" @change="handleCfgChange"/>
            <span> ServerStatus </span>
            <a-radio-group v-model="show.status" @change="handleCfgChange" size="small">
              <a-radio-button value="run">Run</a-radio-button>
              <a-radio-button value="all">All</a-radio-button>
              <a-radio-button value="stop">Stop</a-radio-button>
            </a-radio-group>
            <span> System </span>
            <a-select size="small" style="width: 120px" v-model="show.sys" showSearch :filterOption="filterOption" @change="handleCfgChange" >
              <a-select-option key="-1" :value="''">All</a-select-option>
              <a-select-option v-for="i in systems" :key="i" :value="i">{{i}}</a-select-option>
            </a-select>
            <span> ServerType </span>
            <a-select size="small" style="width: 120px" v-model="show.serverType" showSearch :filterOption="filterOption" @change="handleCfgChange" >
              <a-select-option key="-1" :value="''">All</a-select-option>
              <a-select-option v-for="i in serverTypes" :key="i" :value="i">{{i}}</a-select-option>
            </a-select>
          </div>
          <div style="height:100%;border:2px solid #e8e8e8; " id="pomeloSystemGraph" />
        </div>
      </a-col>
      <a-col :span="4">
        <div v-if="curSelNode !== null">
          <h4 style="textAlign:center">{{(curSelNode.lv==='sys')?curSelNode.ip : curSelNode.serverId}}</h4>
          <div style="margin:6px;" v-if="curSelNode.lv==='node' && (curSelNode.serverType!=='master')">
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
            <a-button style="margin-left:6px;" type="dashed" size="small" shape="circle" icon="info" @click="onDetailInfo(curSelNode)" title="Goto Server Info page."></a-button>
          </div>
          <ul style="font-size:10px">
            <li v-for="(val,key) in curSelNode" :key="key">
              <span v-if="typeof(val) !== 'object'">
                <template v-if="typeof(val) === 'number'">
                  <template v-if="Number.isInteger(val)">
                    <a-tag>{{key}}</a-tag>{{ (key.indexOf('mem') === -1)?val:(val/1024/1024).toFixed(0)+' MB'}}
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
        <div v-else>
          <h4 style="textAlign:center">选择节点显示详细信息</h4>
        </div>
      </a-col>
    </a-row>
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
        <a-switch v-model="addSer.frontend" checkedChildren="frontend" unCheckedChildren="backend" :disabled="!dlgAddEdit"></a-switch>
      </a-form-item>
      <a-form-item v-if="addSer.frontend" label="clientPort" :label-col="formTailLayout.labelCol" :wrapper-col="formTailLayout.wrapperCol">
        <a-input-number v-model="addSer.clientPort" :min='1000'>
        </a-input-number>
      </a-form-item>
    </a-modal>
    <div >
        <a-menu size="small" id="contextMenuNode" style="display:none;position: fixed;" theme="dark"
        @click="handleMenuNodeClick">
          <a-menu-item key="Stop" v-if="curSelNode && curSelNode.runStatus"><a-icon type="poweroff" />Stop</a-menu-item>
          <a-menu-item key="Start" v-if="curSelNode && curSelNode.runStatus===false"><a-icon type="caret-right" />Start</a-menu-item>
          <a-menu-item key="Edit" v-if="curSelNode && curSelNode.runStatus===false"><a-icon type="edit" />Edit</a-menu-item>
          <a-menu-item key="Delete" v-if="curSelNode && curSelNode.runStatus===false"><a-icon type="close" />Delete</a-menu-item>
          <a-menu-item key="Info" v-if="curSelNode && curSelNode.runStatus"><a-icon type="info" />Info</a-menu-item>
        </a-menu>
        <a-menu size="small" id="contextMenuSys" style="display:none;position: fixed;" theme="dark"
        @click="handleMenuSysClick">
          <a-menu-item key="StopAll"><a-icon type="poweroff" />Stop All</a-menu-item>
          <a-menu-item key="StartAll"><a-icon type="caret-right" />Start All</a-menu-item>
        </a-menu>
        <a-menu size="small" id="contextMenuType" style="display:none;position: fixed;" theme="dark"
        @click="handleMenuTypeClick">
          <a-menu-item key="StopAll"><a-icon type="poweroff" />Stop All</a-menu-item>
          <a-menu-item key="StartAll"><a-icon type="caret-right" />Start All</a-menu-item>
          <a-sub-menu title="MoveTo" key="MoveTo" >
            <a-menu-item v-for="i in systems" :key="i" :value="i">{{i}}</a-menu-item>
          </a-sub-menu>
        </a-menu>
    </div>
  </div>
</template>

<script>
import { axios } from '@/utils/request';
import notification from 'ant-design-vue/es/notification';
import G6 from '@antv/g6';

let ipHideTimer;

const TREE_NODE = 'tree-node';

const SOFAROUTER_TEXT_CLASS = 'sofarouter-text-class';
const SOFAROUTER_RECT_CLASS = 'sofarouter-rect-class';

// const CANVAS_WIDTH = document.getElementById('container').scrollWidth;
// const CANVAS_HEIGHT = document.getElementById('container').scrollHeight;

const getNodeConfig = function getNodeConfig (node) {
  const cfgPurple = { basicColor: '#722ED1', fontColor: '#722ED1', borderColor: '#722ED1', bgColor: '#F6EDFC' };
  const cfgGray = { basicColor: '#E3E6E8', fontColor: 'rgba(0,0,0,0.85)', borderColor: '#838688', bgColor: '#F7F9FA' };
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
const LineStartX = -48; // 绘制比例线的起始位置

function strLen (str) {
  let len = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (str.charCodeAt(i) > 0 && str.charCodeAt(i) < 128) {
      len += 1;
    } else {
      len += 2;
    }
  }
  return len;
};

/* 精简节点和复杂节点共用的一些方法 */
const nodeBasicMethod = {
  createNodeBox: function createNodeBox (group, config, width, height, isRoot) {
    /* 最外面的大矩形 */
    const container = group.addShape('circle', {
      attrs: {
        x: 0,
        y: 0,
        r: width
      },
      name: 'container-rect-shape'
    });

    /* 矩形 */
    group.addShape('circle', {
      attrs: {
        x: 3,
        y: 0,
        r: width,
        fill: config.bgColor,
        stroke: config.borderColor
        // radius: 2
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
    const orgi = data.orgi;
    const { nodeError } = data;
    /* 最外面的大矩形 */
    let container = null;
    let isVirNode = !(data.lv === 'sys' || data.lv === 'node');

    if (isVirNode) {
      container = nodeCircleMethod.createNodeBox(group, config, 24, isRoot);
    } else {
      container = nodeBasicMethod.createNodeBox(group, config, 24, 64, isRoot);
    }

    if (data.dataType !== 'root') {
      /* 上边的 type */
      if (isVirNode) {
        group.addShape('text', {
          attrs: {
            text: data.id + `(${data.cnt})`,
            x: -12,
            y: -36,
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
            text: data.id + (data.cnt ? ` ( ${data.cnt} )` : ''),
            x: -48,
            y: -48,
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'left',
            textBaseline: 'middle',
            fill: 'rgba(0,0,0,0.65)'
          },
          name: 'type-text-shape'
        });

        if (data.lv === 'sys') {
          group.addShape('path', {
            attrs: {
              startArrow: false,
              endArrow: false,
              path: [
                ['M', LineStartX + 100, -38],
                ['L', LineStartX, -38]
              ],
              stroke: '#000',
              lineWidth: 1,
              lineAppendWidth: 5
            },
            // must be assigned in G6 3.3 and later versions. it can be any value you want
            name: 'path-shape-base'
          });
        }
      }
    }

    if (!isVirNode) {
      let it = data.orgi;
      let msg = '';

      if (data.lv === 'sys') {
        msg = `${(it.cpu_idle < 0) ? 99 : it.cpu_idle.toFixed(1)}`;
        let ratMem = parseInt(it['free/total'] * 100);
        group.addShape('path', {
          attrs: {
            startArrow: false,
            endArrow: false,
            path: [
              ['M', LineStartX + ratMem, -33],
              ['L', LineStartX, -33]
            ],
            stroke: '#2F54EB',
            lineWidth: 2,
            lineAppendWidth: 5
          },
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'path-shape-mem'
        });

        let cpuIdle = it.cpu_idle;
        if (cpuIdle < 0) { cpuIdle = 0.99; }
        let ratCpu = parseInt(cpuIdle);
        group.addShape('path', {
          attrs: {
            startArrow: false,
            endArrow: false,
            path: [
              ['M', LineStartX + ratCpu, -28],
              ['L', LineStartX, -28]
            ],
            stroke: '#52C41A',
            lineWidth: 2,
            lineAppendWidth: 5
          },
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'path-shape-cpu'
        });
      } else if (data.lv === 'node') {
        msg = `${it.port}`;
        if (((it.port < 0) || (it.port === undefined)) &&
          it.clientPort !== undefined && it.clientPort > 0) {
          msg = `${it.clientPort}`;
        }

        group.addShape('text', {
          attrs: {
            text: data.descr,
            x: -48,
            y: -30,
            fontSize: 14,
            textAlign: 'left',
            textBaseline: 'middle',
            fill: 'rgba(0,0,0,0.65)'
          },
          name: 'content-text-shape'
        });

        group.addShape('text', {
          attrs: {
            text: msg,
            x: -18,
            y: 3,
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'middle',
            textBaseline: 'middle',
            fill: config.fontColor,
            cursor: 'pointer'
          },
          name: 'name-text-shape'
        });
      }
    }

    const hasChildren = cfg.children && cfg.children.length > 0;
    if (hasChildren) {
      if (isVirNode) {
        nodeCircleMethod.createNodeMarker(group, cfg.collapsed, 4, 0);
      } else {
        nodeBasicMethod.createNodeMarker(group, cfg.collapsed, 38, 0);
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
  name: 'SystemGraph',
  components: {},
  data () {
    return {
      formItemLayout,
      formTailLayout,
      graph: null,
      show: {
        serverTypeNode: false,
        status: 'run', // all,显示所有服务器; run,只显示运行状态; stop,只显示停止状态
        serverType: '',
        sys: '',
        layout: 'radial'
      },
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
      curSelNodeData: null, // graph model
      dlgAddBatchVisable: false,
      txtBatchAdd: '',
      layout: {
        'radial': {
          type: 'compactBox', // 'compactBox','dendrogram'
          direction: 'H',
          getId: d => d.id,
          getWidth: () => 243,
          getVGap: () => 24,
          getHGap: () => 50,
          radial: true
        },
        'rect': {
          type: 'compactBox', // 'compactBox','dendrogram'
          direction: 'H', // LR
          getId: d => d.id,
          getWidth: () => 243,
          getVGap: () => 24,
          getHGap: () => 50,
          radial: false
        }
      },
      graphSize: { width: 1000, height: 600 }
    };
  },
  computed: {
    gData () {
      let o = this.$store.getters.sexpSystemMap;
      let showStatus = this.show.status;
      let data = { id: 'sex',
        children: [],
        descr: '',
        cnt: 1,
        lv: 'root',
        keyInfo: 'sex-pomelo'
      };

      for (let sys in o) {
        let it = o[sys];
        if (this.show.sys.length > 0 && this.show.sys !== it.ip) {
          continue;
        }

        let free = parseInt((it.freemem / 1024 / 1024));
        let rat = it['free/total'].toFixed(2);
        let msg = `mem ${free}M (${rat}) cpu ${it.cpu_idle.toFixed(1)}`;
        let nSys = { id: it.ip,
          descr: msg,
          cnt: Object.keys(it.nodes).length,
          lv: 'sys',
          ip: it.ip,
          keyInfo: msg,
          orgi: it,
          runCnt: 0 // 正在运行节点数量
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
            if (v.runStatus === true) nSys.runCnt = 1;
          } else {
            types[v.serverType].children.push(node);
            types[v.serverType].cnt++;
            if (v.runStatus === true) nSys.runCnt++;
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

        if (nodes.length > 0) {
          nSys.children = nodes;
          data.children.push(nSys);
        }
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
    let show = this.getStore('sexp-cli:graph');
    if (show === null) {
      this.saveGraphCfg();
    }

    this.show = Object.assign({}, this.show, show);
  },
  mounted () {
    this.createGraphics();

    const that = this;
    window.onresize = () => {
      return (() => {
        that.graphSize = that.calcGraphSize();
      })();
    };
  },
  methods: {
    saveGraphCfg () {
      this.setStore('sexp-cli:graph', this.show);
    },
    calcGraphSize () {
      const viewElem = document.getElementById('pomeloSystemGraph');
      let width = parseInt(viewElem.clientWidth);
      let height = document.body.clientHeight - 180;
      return { width, height };
    },
    createGraphics () {
      this.graphSize = this.calcGraphSize();
      let self = this;
      const graph = new G6.TreeGraph({
        container: 'pomeloSystemGraph',
        width: this.graphSize.width,
        height: this.graphSize.height,
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
          'drag-canvas', 'zoom-canvas', 'drag-node' ]
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
        layout: self.layout[self.show.layout]
      });

      graph.on('beforepaint', () => {
        const topLeft = graph.getPointByCanvas(0, 0);
        const bottomRight = graph.getPointByCanvas(this.graphSize.width, this.graphSize.height);
        graph.getNodes().forEach(node => {
          const model = node.getModel();
          if (model.x < topLeft.x - 200 || model.x > bottomRight.x + 100 || model.y < topLeft.y || model.y > bottomRight.y) {
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

        self.showNodeDetail(data);
      });

      graph.on('node:contextmenu', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        const { item } = evt;
        const shape = evt.target;
        let data = item._cfg.model;
        self.showNodeDetail(data);

        if (data.orgi && data.orgi.serverType === 'master') {
          return;
        }

        let menu = null;

        switch (data.lv) {
        case 'sys':
          menu = document.getElementById('contextMenuSys');
          break;
        case 'node':
          menu = document.getElementById('contextMenuNode');
          break;
        case 'type':
          menu = document.getElementById('contextMenuType');
          break;
        }

        if (menu !== null) {
          let xy = this.graph.getClientByPoint(evt.x, evt.y);
          menu.style.left = `${xy.x}.px`;
          menu.style.top = `${xy.y}px`;
          menu.style.display = 'block';
        }
      });

      graph.on('node:mouseleave', () => {
        document.getElementById('contextMenuNode').style.display = 'none';
        document.getElementById('contextMenuType').style.display = 'none';
        document.getElementById('contextMenuSys').style.display = 'none';
      });

      // graph.on('contextmenu', (evt) => {
      //   evt.preventDefault();
      //   evt.stopPropagation();
      //   let nodeMenu = document.getElementById('contextMenu');
      //   let xy = this.graph.getClientByPoint(evt.x, evt.y);
      //   nodeMenu.style.left = `${xy.x}.px`;
      //   nodeMenu.style.top = `${xy.y}px`;
      // });

      /// /////
      this.graph = graph;
      gGraph = graph;
      this.graph.data(this.gData);
      this.graph.render();
      this.graph.fitView();
    },
    showNodeDetail (data) {
      let id = data.id;
      let dataType = data.lv;
      this.curSelNode = null;
      this.curSelNodeData = null;
      if (dataType === 'sys') {
        this.curSelNode = this.$store.getters.sexpSystem(id);
      } else if (dataType === 'node') {
        this.curSelNode = this.$store.getters.sexpNode(id);
      } else {
        this.curSelNodeData = data;
      }
      if (this.curSelNode) {
        this.curSelNode.lv = dataType;
      }
    },
    handleLayoutChange (layout) {
      this.graph.updateLayout(this.layout[layout]);
      this.saveGraphCfg();
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    handleCfgChange (value) {
      this.saveGraphCfg();
    },
    async stopServer (ser) {
      let ret = await this.$store.dispatch('StopServer', ser.serverId);
      this.axiosMsg(ret);
    },
    async startServer (ser) {
      let ret = await this.$store.dispatch('StartServer', ser);
      this.axiosMsg(ret);
    },
    async deleteServer (ser) {
      let ret = await this.$store.dispatch('DeleteServer', ser.serverId);
      if (ret.status === 'success') {
        this.curSelNode = null;
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
      let ret = await this.$store.dispatch('UpdateServer', newCfg);
      if (ret.status === 'success') {
        this.dlgAddVisable = false;
      }
      this.$message[ret.status](ret.message);
    },
    async onHandlerDlgOk () {
      this.editServer();
    },
    handleMenuNodeClick (e) {
      if (this.curSelNode !== null) {
        switch (e.key) {
        case 'Edit':this.showEditDlg(this.curSelNode); return;
        case 'Info': this.onDetailInfo(this.curSelNode); return;
        }

        let self = this;
        this.$confirm({
          title: `Do you Want to ${e.key} ${this.curSelNode.serverId} ?`,
          // content: h => <div style="color:red;">Some descriptions</div>,
          onOk () {
            switch (e.key) {
            case 'Stop': self.stopServer(self.curSelNode); break;
            case 'Start': self.startServer(self.curSelNode); break;
            case 'Delete': self.deleteServer(self.curSelNode); break;
            }
          },
          onCancel () {
          },
          class: 'test'
        });
      }
    },
    handleMenuSysClick (e) {
      if (this.curSelNode === null) { return; }

      let serverIds = this.getSysChildServerIds(this.curSelNode);
      switch (e.key) {
      case 'StopAll':
        this.$store.dispatch('BatchRunAction', { action: 'stop', serverIds });
        break;
      case 'StartAll':
        this.$store.dispatch('BatchRunAction', { action: 'start', serverIds });
        break;
      }
    },
    async handleMenuTypeClick (e) {
      if (this.curSelNodeData === null) { return; }
      let serverIds = this.getTypeChildServerIds(this.curSelNodeData);

      let cmd = e.key;
      if (e.keyPath.length > 1) {
        cmd = e.keyPath[e.keyPath.length - 1];
      }

      switch (cmd) {
      case 'StopAll':
        this.$store.dispatch('BatchRunAction', { action: 'stop', serverIds });
        break;
      case 'StartAll':
        this.$store.dispatch('BatchRunAction', { action: 'start', serverIds });
        break;
      case 'MoveTo':
        {
          let newHost = e.key;
          let servers = this.$store.getters.sexpServers;
          let data = [];
          for (let ser of this.curSelNodeData.children) {
            let sInfo = servers[ser.id];
            if (sInfo !== undefined) {
              if (sInfo.runStatus === true) {
                this.$message.warn(`${ser.id} is Run,can't move run server`);
                return;
              } else {
                const { serverId, host, serverType, port, frontend, clientPort } = sInfo;
                if (host === newHost) {
                  continue;
                }
                let newData = {
                  serverId,
                  serverType,
                  port,
                  frontend,
                  clientPort,
                  host: newHost
                };
                data.push(newData);
              }
            }
          }
          this.$store.dispatch('BatchRunAction', { action: 'moveto', serverInfos: data });
        } break;
      }
    },
    getSysChildServerIds (nodeData) {
      let ids = [];
      for (let serId in nodeData.nodes) {
        if (serId.indexOf('master') === -1) {
          ids.push(serId);
        }
      }
      return ids;
    },
    getTypeChildServerIds (nodeData) {
      let ids = [];
      if (nodeData.children instanceof Array) {
        for (let it of nodeData.children) {
          ids.push(it.id);
        }
      }

      return ids;
    },
    onDetailInfo (ser) {
      console.log(ser);
      this.$router.push({
        path: '/dashboard/serverinfo',
        query: { serverId: ser.serverId }
      });
    }
  },
  watch: {
    gData (val) {
      this.graph.changeData(val);
    },
    graphSize (val) {
      if (!this.timer) {
        this.timer = true;
        let that = this;
        setTimeout(function () {
          that.timer = false;
          that.graph.changeSize(that.graphSize.width, that.graphSize.height);
        }, 400);
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
