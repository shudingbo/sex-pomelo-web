<template>
  <div>
    <a-tabs defaultActiveKey="sysG">
      <a-tab-pane tab="Graphics" key="sysG" forceRender>
        <div id="container" />
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

export default {
  name: 'Workplace',
  components: {

  },
  data () {
    return {
      sysColumns,
      nodeColums,
      servers: [],
      filter: ['']
    };
  },
  computed: {
    sysMap () {
      return this.$store.getters.sexpSystemMap;
    },
    sysMapArr () {
      let ret = [];
      let o = this.$store.getters.sexpSystemMap;
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
      let data = { id: 'sex', children: [], descr: '', cnt: 1 };
      let o = this.$store.getters.sexpSystemMap;
      for (let sys in o) {
        let it = o[sys];
        let msg = `memfree: ${it.freemem}`;
        let nSys = { id: it.hostname, descr: msg, cnt: Object.keys(it.nodes).length, lv: 'sys' };

        let types = {};
        for (let i in it.nodes) {
          let v = it.nodes[i];

          let msg = `memAvg: ${v.memAvg}`;
          let node = { id: v.serverId, descr: msg, lv: 'node' };

          if (types[v.serverType] === undefined) {
            types[v.serverType] = { id: v.serverType, descr: '', children: [node], lv: 'node', cnt: 1 };
          } else {
            types[v.serverType].children.push(node);
            types[v.serverType].cnt++;
          }
        }

        let nodes = [];
        for (let i in types) {
          nodes.push(types[i]);
        }

        nSys.children = nodes;
        data.children.push(nSys);
      }
      return data;
    }
  },
  created () {
    this.setSexpContext('all');
    this.getServiceList();
    console.log(this.gData);
  },
  mounted () {
    this.createGraphics();
  },
  methods: {
    async getServiceList () {
      let servers = this.$store.getters.sexpServers;
      for (let key in servers) {
        let info = servers[key];
        info.runStatus = true;
        this.servers.push(info);
      }
    },
    createGraphics () {
      const width = document.getElementById('container').scrollWidth;
      const height = document.getElementById('container').scrollHeight || 500;
      const graph = new G6.TreeGraph({
        container: 'container',
        width,
        height,
        linkCenter: true,
        modes: {
          default: ['drag-canvas', 'zoom-canvas',
            {
              type: 'collapse-expand',
              onChange: function onChange (item, collapsed) {
                const data = item.getModel();
                data.collapsed = collapsed;
                return true;
              }
            },
            {
              type: 'tooltip',
              formatText: function formatText (model) {
                const text = '' + model.descr;
                return text;
              }
            }
          ]
        },
        nodeStateStyles: {
          // 鼠标hover状态下的配置
          hover: {
            fillOpacity: 0.8
          },
          // 选中节点状态下的配置
          selected: {
            lineWidth: 5
          }
        },
        defaultNode: {
          // type: 'rect',
          size: 16,
          style: {
            fill: '#C6E5FF',
            stroke: '#5B8FF9'
          }
        },
        defaultEdge: {
          style: {
            stroke: '#A3B1BF'
          }
        },
        layout: {
          type: 'dendrogram',
          direction: 'LR',
          nodeSep: 20,
          rankSep: 100,
          radial: true
        }
        // layout: {
        //   type: 'compactBox',
        //   direction: 'LR',
        //   getId: function getId (d) {
        //     return d.id;
        //   },
        //   getHeight: function getHeight () {
        //     return 16;
        //   },
        //   getWidth: function getWidth () {
        //     return 16;
        //   },
        //   getVGap: function getVGap () {
        //     return 10;
        //   },
        //   getHGap: function getHGap () {
        //     return 100;
        //   }
        // }
      });

      graph.node(function (node) {
        let label = node.id;
        if (node.cnt !== undefined) {
          label += `(${node.cnt})`;
        }

        return {
          label,
          labelCfg: {
            offset: 10,
            position: node.children && node.children.length > 0 ? 'left' : 'right'
          }
        };
      });

      graph.data(this.gData);
      graph.render();
      graph.fitView();
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
    padding: 10px 8px;
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
  }

</style>
