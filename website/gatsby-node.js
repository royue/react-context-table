const path = require('path')
const _ = require('lodash')

const siteConfig = require('./siteConfig')

exports.onCreateWebpackConfig = ({ getConfig, loaders, actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        assets: path.resolve(__dirname, 'src/assets'),
        components: path.resolve(__dirname, 'src/components'),
        utils: path.resolve(__dirname, 'src/utils'),
        siteConfig: path.resolve(__dirname, 'siteConfig'),
        'react-context-table/package.json': path.resolve(
          __dirname,
          '../package.json'
        ),
        'react-context-table/styles.css': path.resolve(
          __dirname,
          '../styles.css'
        ),
        'react-context-table': path.resolve(__dirname, '../src'),
      },
    },
    // module: {
    //   rules: [
    //     {
    //       test: /\.js?$/,
    //       use: {
    //         loader: 'babel-loader',
    //         options: {
    //           presets: [require.resolve('babel-preset-gatsby')],
    //           plugins: [
    //             require.resolve('@babel/plugin-proposal-class-properties'),
    //           ],
    //         },
    //       },
    //     },
    //   ],
    // },
  })
}

exports.onCreateNode = ({ node, actions, getNode, createNodeId }) => {
  const { createNodeField, createNode, createParentChildLink } = actions
  if (node.internal.type === 'MarkdownRemark') {
    let slug
    const fileNode = getNode(node.parent)
    if (!fileNode.relativePath) return

    const parsedFilePath = path.parse(fileNode.relativePath)
    if (parsedFilePath.name !== 'index' && parsedFilePath.dir !== '') {
      slug = `/${parsedFilePath.dir}/${parsedFilePath.name}`
    } else if (parsedFilePath.dir === '') {
      slug = `/${parsedFilePath.name}`
    } else {
      slug = `/${parsedFilePath.dir}`
    }
    slug = `/${fileNode.sourceInstanceName}${slug}`

    // Add slug as a field on the node.
    createNodeField({ node, name: 'slug', value: slug })
  } else if (
    node.internal.type === 'ComponentMetadata' &&
    node.methods.length
  ) {
    node.methods
      .filter(method => method.docblock)
      .map(method => {
        const methodNode = {
          id: createNodeId(`${node.id} >>> ${method.name}`),
          parent: node.id,
          children: [],
          name: method.name,
          params: method.params,
          description: method.description,
          internal: {
            type: `ComponentMethodExt`,
            mediaType: `text/markdown`,
            content: method.description,
            contentDigest: method.description,
          },
        }

        createNode(methodNode)
        createParentChildLink({ parent: node, child: methodNode })
      })
  }
}

exports.createPages = async ({ graphql, actions, getNode }) => {
  const { createPage } = actions

  const docPage = path.resolve('src/templates/doc.js')
  const apiPage = path.resolve('src/templates/api.js')
  const examplePage = path.resolve('src/templates/example.js')

  const result = await graphql(
    `
      {
        allMarkdownRemark {
          edges {
            node {
              fields {
                slug
              }
            }
          }
        }
        allComponentMetadata {
          edges {
            node {
              parent {
                id
              }
              displayName
              docblock
            }
          }
        }
        allRawCode {
          edges {
            node {
              name
            }
          }
        }
      }
    `
  )
  if (result.errors) {
    throw new Error(result.errors)
  }

  result.data.allMarkdownRemark.edges.forEach(edge => {
    const slug = _.get(edge, 'node.fields.slug')
    if (!slug || !slug.includes('docs')) return
    createPage({
      path: slug,
      component: docPage,
      context: {
        slug,
      },
    })
  })

  result.data.allComponentMetadata.edges.forEach(edge => {
    const node = edge.node
    const fileNode = getNode(node.parent.id)
    if (fileNode.sourceInstanceName !== 'api') return
    const { displayName: name, docblock } = node
    if (!docblock) return
    createPage({
      path: `/api/${name.toLowerCase()}`,
      component: apiPage,
      context: {
        name,
      },
    })
  })

  result.data.allRawCode.edges.forEach(edge => {
    const name = edge.node.name
    createPage({
      path: `/examples/${name}`,
      component: examplePage,
      context: {
        name,
      },
    })
  })
}
// exports.onCreateBabelConfig = ({ actions }) => {
//   actions.setBabelPlugin({
//     name: '@babel/plugin-proposal-class-properties',
//     // 可选：配置 loose 模式（默认为 false）
//     options: { loose: true }, // 直接通过赋值语法编译，而非 Object.defineProperty
//   })
// }
exports.onCreateBabelConfig = ({ actions }) => {
  console.log('onCreateBabelConfig', actions)
  // actions.overrideBabelConfig(({ babelConfig }) => {
  //   babelConfig.plugins = babelConfig.plugins || []
  //   babelConfig.plugins.push([
  //     '@babel/plugin-proposal-class-properties',
  //     { loose: true },
  //   ])
  //   return babelConfig
  // })
  actions.setBabelPreset({
    name: '@babel/preset-env',
    options: {
      targets: { browsers: ['last 2 versions'] },
      loose: true,
    },
  })
}
