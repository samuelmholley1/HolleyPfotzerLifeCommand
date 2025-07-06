const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  entry: './index.web.js',
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native/Libraries/ReactNative/AppRegistry': 'react-native-web/dist/modules/AppRegistry',
    },
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "vm": require.resolve("vm-browserify"),
      "fs": false,
      "better-sqlite3": false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'assets/',
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY),
      'process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID),
      'process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID),
      'process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID),
      '__DEV__': JSON.stringify(true),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  devtool: 'source-map',
};
