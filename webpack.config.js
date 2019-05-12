//引入路径插件
const path = require('path');
//引入遍历文件夹的插件
const fs = require('fs');
//引入导出html插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
//引入清除插件
const CleanWebpackPlugin = require('clean-webpack-plugin');
//引入导出css插件
const ExtractTextPlugin = require('extract-text-webpack-plugin');
//引入webpack
const webpack = require('webpack');
//引入压缩css的插件
const optimizeCss = require('optimize-css-assets-webpack-plugin');
//引入cssnano插件
const cssnano = require('cssnano');
//兼容ie8的插件
const es3ifyPlugin = require('es3ify-webpack-plugin');
//引入js压缩插件
const uglifyjs = require('uglifyjs-webpack-plugin');
//定义webpak.config.js相对于pages的路径
const pagePath = './src/pages/';

/**
 * 遍历文件夹，把所有文件的路径拼到一个数组里，然后通过map获取到每一个文件
 * 
 */
function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function (file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}
//获取pages下面的文件夹
const folders = getFolders(pagePath);

/**
 * 遍历文件夹自动添加entry
 */
function addEntry() {
  let entryObj = {};
  folders.forEach(f => {
    entryObj[f] = `${pagePath + f}/index.js`;
  });
  return entryObj;
}


//webpack配置内容
const config = {
  //入口
  entry: addEntry(),
  //便于调试
  devtool: 'inline-source-map',
  //服务
  devServer: {
    contentBase: 'dist',
    open: true
  },
  resolve: {
    extensions: ['.js', '.json'], // 引入时可以省略相应的扩展名
    alias: {
      '@': path.resolve(__dirname, './src') // 使用 @ 代替了 src 文件夹
    }
  },
  //loader模块
  module: {
    rules: [
      {//ES6
        test: /\.js$/,
        loader: 'babel-loader',
        // exclude:__dirname+'node_modules',//不对这个进行babel转换，这里边已经打包好，这样能减少打包时间
        // include:__dirname+'src'这里的src是你要编译的js文件的目录,
        exclude: path.resolve(__dirname, 'node_modules'),
        include: path.resolve(__dirname, '../src'),
        query: {//若在package.json中定义了这个presets，则这边可以删掉
          presets: ['es2015', 'es2015-loose'],
          ignore: ['./lib/webuploader/*.js']
        }
      },
      // {
      //   test: /.js$/,
      //   enforce: 'post', // post-loader处理
      //   loader: 'es3ify-loader'
      // },
      {//Jquery
        test: require.resolve('jquery'),
        use: [{
          loader: 'expose-loader',
          options: 'jQuery'
        }, {
          loader: 'expose-loader',
          options: '$'
        }]
      },
      {//CSS
        test: /\.css/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader','postcss-loader']
        })
      },
      {//Sass
        test: /\.scss/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ['css-loader', 'sass-loader', 'postcss-loader']
        })
      },
      {//处理模块html
        test: /\.html$/,
        use: 'html-loader'
      },
      {//图片
        test: /\.(jpg|png|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'images',
            name: '[name]_[hash].[ext]'
          }
        }
      },
      //字体图标
      {
        test: /\.(eot|svg|ttf|woff|woff2)\w*/,
        loader: 'file-loader'
      },
      {
        test: /\.htc$/,
        loader: 'file-loader'
      },
      {
        test: /\.swf$/,
        loader: 'url-loader'
      }
    ]
  },
  //插件
  plugins: [
    //全局引入jquery
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      jquery: "jquery",
      "window.jQuery": "jquery",
      identifier: ['es5-shim', 'es5-shim/es5-sham'],
    }),
    //清空build文件下的多余文件
    new CleanWebpackPlugin(),
    //将css单独打包插件
    new ExtractTextPlugin({
      filename: "[name].css",//制定编译后的文件名称
      allChunks: true,//把分割的块分别打包
    }),
    //压缩css
    new optimizeCss({
      assetNameRegExp: /\.style\.css$/g,
      cssProcessor: cssnano,
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true
    }),
    //压缩js
    new uglifyjs({
      parallel: true,
      include: /\/node_modules/,
      uglifyOptions: {
        ie8: true
      }
    }),
    new es3ifyPlugin()
  ],
  //压缩优化css
  optimization: {
    // minimize: true,
    minimizer: [new optimizeCss({})]
  },
  //出口
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
}

//自动添加html
folders.forEach(f => {
  let htmlPlugin = {
    filename: `${f}.html`,
    template: `${pagePath + f}/index.html`,
    // favicon:'./images/favicon.ico',
    chunks: [`${f}`],
    inject: true,
    hash: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true
    }
  }
  config.plugins.push(new HtmlWebpackPlugin(htmlPlugin));
})

module.exports = config;