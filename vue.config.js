const path = require('node:path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const pages = {}

const chromeName = ['popup', 'background', 'options', 'content']

chromeName.forEach((name) => {
  pages[name] = {
    entry: `src/pages/${name}/main.js`,
    template: 'public/index.html',
    filename: `${name}.html`
  }
})
pages['zx'] = {
  entry: `src/pages/content/zx.js`,
}

module.exports = {
  pages,
  filenameHashing: false,
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{
          from: path.resolve('manifest.json'),
          to: `${path.resolve('dist')}/manifest.json`
        }]
      })]
  }
}
