const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const devMode = process.env.NODE_ENV !== 'production';  // 获取 cross-env 设置的 NODE_ENV

//动态添加入口
const getEntry = (PAGES_DIR) => {
    var entry = {};
    //读取src目录所有page入口
    glob.sync(PAGES_DIR + '**/*.js').forEach(function (name) {
        var start = name.indexOf('pages/') + 4;
        var end = name.length - 3;
        var eArr = [];
        var n = name.slice(start, end);
        n = n.split('/')[1];
        eArr.push(name);
        entry[n] = eArr;
    })
    return entry;
}
const htmlPluginArr = () => {
    const htmlDir = path.resolve(__dirname, 'src/pages');
    const templateFiles = glob.sync(htmlDir + '/**/*.{html,ejs}');
    const reg = /\/src\/pages\/([^/]+).?\/index\.((html)|(ejs))/i
    return templateFiles.filter((filePath) => reg.test(filePath)).map(filePath => {
        reg.test(filePath)
        const filename = RegExp.$1;
        const baseOption = {
            filename: `${filename}.html`, //目标文件
            template: filePath,
            chunks: [filename], // 包含的与html同名的chunks代码块
            inject: true,  // script 插入body底部
            minify: { //压缩
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true
                // 更多配置
                // https://github.com/kangax/html-minifier#options-quick-reference
            },
            // necessary to consistently work with multiple chunks via CommonsChunkPlugin
            chunksSortMode: 'dependency',  //按照依赖顺序引入script
        }
        return new HtmlWebpackPlugin(baseOption);
    })
}
let entrys = getEntry('./src/pages/')

module.exports = {
    mode: devMode ? 'development' : 'production', // mode 是 4.x 新增的配置，可以选择 "development","production","none" 是三种值,可以区分开发环境和生产环境。
    entry: entrys, // 解构对象
    output: {
        path: path.resolve(__dirname, 'dist'),  // 打包后目录
        publicPath: '/',  // 静态文件目录
        filename: 'static/js/[name].[hash:7].min.js',  // 定义输出的目录和文件名
    },
    devServer: {
        contentBase: path.join(__dirname, "./src"),
        publicPath: '/',
        host: "127.0.0.1",
        port: "8080",
        overlay: true, // 浏览器页面上显示错误
        open: true, // 开启自动打开浏览器
        // stats: "errors-only", //stats: "errors-only"表示只打印错误：
        hot: true // 开启热更新
    },
    resolve: {
        extensions: ['.js', '.json'], // 引入时可以省略相应的扩展名
        alias: {
            '@': path.resolve(__dirname, './src') // 使用 @ 代替了 src 文件夹
        }
    },
    plugins: [
        ...htmlPluginArr(),
        new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({
            filename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
            chunkFilename: `static/style/${devMode ? '[name].css' : '[name].[hash].css'}`,
        })
    ],
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            },
            {//ES6
                test: /\.js$/,
                loader: 'babel-loader',
                // exclude:__dirname+'node_modules',//不对这个进行babel转换，这里边已经打包好，这样能减少打包时间
                // include:__dirname+'src'这里的src是你要编译的js文件的目录,
                exclude: path.resolve(__dirname, 'node_modules'),
                include: path.resolve(__dirname, 'pages'),
                query: {//若在package.json中定义了这个presets，则这边可以删掉
                    presets: ['es2015']
                }
            },
            {
                test: /\.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10240,   // 大于10kb将解析成base64
                            name: 'static/images/[name].[hash:7].[ext]' //输出目录及文件名
                        }
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            // https://github.com/tcoopman/image-webpack-loader
                            mozjpeg: {  //压缩jpeg
                                progressive: true,
                                quality: 65
                            },
                            optipng: {
                                enabled: false,
                            },
                            pngquant: {
                                quality: '65-90',
                                speed: 4
                            },
                            gifsicle: {
                                interlaced: false,
                            },
                            webp: {
                                quality: 75
                            }
                        }
                    }
                ]
            },
            {
                test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000,
                            name: 'static/fonts/[name].[hash:7].[ext]'
                        }
                    }
                ]
            },
        ]
    },
}