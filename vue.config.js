const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const nodeExternals = require('webpack-node-externals')
const merge = require('lodash.merge')
const TARGET_NODE = process.env.WEBPACK_TARGET === 'node'
const target = TARGET_NODE ? 'server' : 'client'
const isDev = process.env.NODE_ENV !== 'production'
module.exports = {
  //publicPath: isDev ? 'http://127.0.0.1:8080' : 'http://127.0.0.1:3000',
  devServer: {
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    disableHostCheck: true //  新增该配置项 fix ssr console error
  },
  css: {
    sourceMap: !isDev && !TARGET_NODE, // if enable sourceMap:  fix ssr load Critical CSS throw replace of undefind
    // SSR fails when split code
    // https://github.com/vuejs/vue/issues/8488
    // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/90
    // extract: !TARGET_NODE && process.env.NODE_ENV === 'production'
  },
  configureWebpack: () => ({
    // 将 entry 指向应用程序的 server / client 文件
    entry: `./src/entry-${target}.js`,
    // 对 bundle renderer 提供 source map 支持
    devtool: 'source-map',
    target: TARGET_NODE ? 'node' : 'web',
    node: TARGET_NODE ? undefined : false,
    output: {
      libraryTarget: TARGET_NODE ? 'commonjs2' : undefined
    },
    // https://webpack.js.org/configuration/externals/#function
    // https://github.com/liady/webpack-node-externals
    // 外置化应用程序依赖模块。可以使服务器构建速度更快，
    // 并生成较小的 bundle 文件。
    externals: TARGET_NODE
      ? nodeExternals({
        // 不要外置化 webpack 需要处理的依赖模块。
        // 你可以在这里添加更多的文件类型。例如，未处理 *.vue 原始文件，
        // 你还应该将修改 `global`（例如 polyfill）的依赖模块列入白名单
        whitelist: [/\.css$/, /\?vue&type=style/]
      })
      : undefined,
    optimization: {
      splitChunks: TARGET_NODE ? false : undefined
    },
    plugins: [TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin()]
  }),
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        return merge(options, {
          optimizeSSR: false
        })
      })

    if (TARGET_NODE) {
      // fix ssr bug: document not found -- https://github.com/Akryum/vue-cli-plugin-ssr/blob/master/lib/webpack.js
      const isExtracting = config.plugins.has("extract-css");
      if (isExtracting) {
        // Remove extract
        const langs = ["css", "postcss", "scss", "sass", "less", "stylus"];
        const types = ["vue-modules", "vue", "normal-modules", "normal"];
        for (const lang of langs) {
          for (const type of types) {
            const rule = config.module.rule(lang).oneOf(type);
            rule.uses.delete("extract-css-loader");
            // Critical CSS
            rule
              .use("vue-style")
              .loader("vue-style-loader")
              .before("css-loader");
          }
        }
        config.plugins.delete("extract-css");
      }


      config.module
        .rule("vue")
        .use("cache-loader")
        .tap(options => {
          // Change cache directory for server-side
          options.cacheIdentifier += "-server";
          options.cacheDirectory += "-server";
          return options;
        })
    }

    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(options => {
        if (TARGET_NODE) {
          options.cacheIdentifier += "-server";
          options.cacheDirectory += "-server";
        }
        options.optimizeSSR = TARGET_NODE;
        return options;
      })

    // fix ssr hot update bug
    if (TARGET_NODE) {
      config.plugins.delete('hmr')
    }
  }
}
