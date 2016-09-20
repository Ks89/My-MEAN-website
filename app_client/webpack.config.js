const path               = require('path');
const webpack            = require('webpack');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const CopyWebpackPlugin  = require('copy-webpack-plugin');
const DefinePlugin       = require('webpack/lib/DefinePlugin');
const ProvidePlugin      = require('webpack/lib/ProvidePlugin');
var HtmlWebpackPlugin       = require('html-webpack-plugin');
var ManifestPlugin          = require('webpack-manifest-plugin');
var InlineManifestWebpackPlugin   = require('inline-manifest-webpack-plugin');

const ENV  = process.env.NODE_ENV = 'development';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 8080;

const metadata = {
  baseUrl: '/',
  ENV    : ENV,
  host   : HOST,
  port   : PORT
};

module.exports = {
  debug: true,
  devServer: {
    contentBase: 'src',
    historyApiFallback: true,
    host: metadata.host,
    port: metadata.port,
    proxy: {
      '/api/*': {
        target: 'http://localhost:8000',
        secure: false
      }
    }
  },
  devtool: 'source-map',
  entry: {
    'main'  : './src/main.ts',
    'vendor': './src/vendor.ts'
  },
  module: {
    // preLoaders: [
    //  { test: /\.ts$/, exclude: /node_modules/, loader: "tslint"}
    // ],
    loaders: [
      {test: /\.css$/,   loader: 'raw', exclude: /node_modules/},
      {test: /\.css$/,   loader: 'style!css?-minimize', exclude: /src/},
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loaders: ['raw-loader', 'sass-loader']
      },
      {test: /\.html$/,  loader: 'raw'},
      {test: /\.ts$/,   loaders: [
        {loader: 'ts', query: {compilerOptions: {noEmit: false}}},
        {loader: 'angular2-template'}
      ]},
      {test: /\.woff$/,  loader: 'url?limit=10000&mimetype=application/font-woff'},
      {test: /\.woff2$/, loader: 'url?limit=10000&mimetype=application/font-woff'},
      {test: /\.ttf$/,   loader: 'url?limit=10000&mimetype=application/octet-stream'},
      {test: /\.svg$/,   loader: 'url?limit=10000&mimetype=image/svg+xml'},
      {test: /\.eot$/,   loader: 'file'}
    ],
    noParse: [path.join(__dirname, 'node_modules', 'angular2', 'bundles')]
  },
  output: {
    path    : './',
    filename: '[name].js',
    chunkFilename: '[name].js'
  },
  plugins: [
    new CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),
    new ManifestPlugin(),
    new InlineManifestWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'My MEAN Website',
      template: 'src/index.html', // Load a custom template
      inject: 'body' // Inject all scripts into the body
    }),
    new CopyWebpackPlugin([{from: './src/index.html', to: 'index.html'}]),
    new DefinePlugin({'webpack': {'ENV': JSON.stringify(metadata.ENV)}}),
    new ProvidePlugin({
      jQuery: 'jquery',
      jquery: 'jquery',
      $: 'jquery',
      "Tether": 'tether',
      "window.Tether": "tether"})
    ],
    resolve: {
      extensions: ['', '.ts', '.js']
    }
  };