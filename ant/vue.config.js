const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const productionGzipExtensions = ['js', 'css']; // 需要gzip压缩的文件后缀

function resolve (dir) {
  return path.join(__dirname, dir);
}

// vue.config.js
module.exports = {
  /*
    Vue-cli3:
    Crashed when using Webpack `import()` #2463
    https://github.com/vuejs/vue-cli/issues/2463

   */
  /*
  pages: {
    index: {
      entry: 'src/main.js',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    }
  },
  */
  configureWebpack: config => {
    const myConfig = {};

    if (process.env.NODE_ENV === 'production') {
      myConfig.plugins = [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
      ];

      myConfig.plugins.push(
        new CompressionPlugin({
          test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
          threshold: 8192,
          minRatio: 0.8
        })
      );

      myConfig.optimization = {
        minimize: true
      };

      // 警告 webpack 的性能提示
      myConfig.performance = {
        hints: 'warning',
        // 入口起点的最大体积
        maxEntrypointSize: 500000,
        // 生成文件的最大体积
        maxAssetSize: 500000,
        // 只给出 js 文件的性能提示
        assetFilter: function (assetFilename) {
          return assetFilename.endsWith('.js');
        }
      };
    } else { // development
      myConfig.plugins = [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
      ];
    }

    return myConfig;
  },

  chainWebpack: (config) => {
    config.resolve.alias
      .set('@$', resolve('src'))
      .set('@api', resolve('src/api'))
      .set('@assets', resolve('src/assets'))
      .set('@comp', resolve('src/components'))
      .set('@views', resolve('src/views'))
      .set('@layout', resolve('src/layout'))
      .set('@static', resolve('src/static'));

    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('vue-svg-icon-loader')
      .loader('vue-svg-icon-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      });
    /* svgRule.oneOf('inline')
      .resourceQuery(/inline/)
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      })
    */
    if (process.env.use_analyzer) {
      config
        .plugin('webpack-bundle-analyzer')
        .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
    }
  },

  css: {
    loaderOptions: {
      less: {
        modifyVars: {
          /* less 变量覆盖，用于自定义 ant design 主题 */

          /*
          'primary-color': '#F5222D',
          'link-color': '#F5222D',
          'border-radius-base': '4px',
          */
        },
        javascriptEnabled: true
      }
    }
  },

  devServer: {
    // sockHost: 'localhost',
    port: 8050, // 更改默认端口号
    proxy: {
      '/api': {
        // target: 'https://mock.ihx.me/mock/5baf3052f7da7e07e04a5116/antd-pro',
        target: 'https://mock.ihx.me/mock/5baf3052f7da7e07e04a5116/antd-pro',
        ws: false,
        changeOrigin: true
      },
      '/gateway': {
        target: 'https://www.easy-mock.com/mock/5b7bce071f130e5b7fe8cd7d/antd-pro',
        ws: false,
        changeOrigin: true,
        pathRewrite: {
          '^/gateway': '/api'
        }
      }
    }
  },

  productionSourceMap: false,
  lintOnSave: undefined,
  // babel-loader no-ignore node_modules/*
  transpileDependencies: [],
  parallel: require('os').cpus().length > 1
};
