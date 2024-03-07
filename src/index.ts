#! /usr/bin/env node
/* eslint-disable no-console */
import path from 'node:path'
import { request } from 'node:https'

import chalk from 'chalk'
import { Command } from 'commander'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import download from 'download-git-repo'
import ora from 'ora'
import _store from '../store.json'
import pkg from '../package.json'

const storeUri = 'https://cdn.jsdelivr.net/gh/eiog/eicr@main/store.json'
function getStore(src: string) {
  return new Promise<typeof _store>((resolve, reject) => {
    request(src, (res) => {
      let data = ''
      res.on('data', (d: string) => {
        data += d.toString()
      })
      res.on('end', () => {
        return resolve(JSON.parse(data))
      })
      res.on('error', (e) => {
        return reject(e)
      })
    }).end()
  })
}
async function create(name: string, options: any) {
  let store = _store
  const downloadLoading = ora('正在或获取最新列表~')
  try {
    downloadLoading.start()
    const result = await getStore(storeUri)
    downloadLoading.succeed('⭕获取成功~')
    if (result)
      store = result
  }
  catch (error) {
    downloadLoading.fail('❌获取失败，将展示默认列表~')
  }

  // 1.获取当前位置（当前输入命令行的位置）
  const cwd = process.cwd()

  // 2.需要创建的文件（在当前输入命名的位置进行创建）
  const targetPath = path.join(cwd, name)

  // 3.通过交互式命令行，选择我们要创建的模版
  const { projectName } = await inquirer.prompt({
    name: 'projectName',
    type: 'list',
    choices: store,
    message: '🎯请选择一个项目模版进行创建~',
  })

  // 4.判断项目是否已存在
  if (fs.existsSync(targetPath)) {
    // 强制替换: dyi create my-project -f
    if (options.force) {
      await fs.remove(targetPath)
    }
    else {
      // 如果存在，则通过交互式命令询问是否覆盖项目
      const { replace } = await inquirer.prompt([
        {
          name: 'replace',
          type: 'list',
          message: `💢项目已存在、是否确认覆盖? ${chalk.grey(
              '覆盖后原项目无法恢复',
            )}`,
          choices: [
            { name: '⭕确认覆盖~', value: true },
            { name: '❌再考虑下，暂不覆盖~', value: false },
          ],
        },
      ])
      if (!replace)
        return

      await fs.remove(targetPath)
    }
  }

  // 5.复制我们准备好的模版
  const spinner = ora('正在下载~')
  spinner.start()
  download(projectName, name, (err: any) => {
    if (err) {
      console.log(chalk.red('❌下载失败了~'))
      spinner.fail('❌下载失败了~')
      return false
    }
    spinner.succeed()
    console.log(`${chalk.green('\n 🎉项目创建成功~')}  ${chalk.cyan(name)}`)
    console.log(`\n cd ${chalk.cyan(name)}`)
    console.log('\n pnpm install')
    console.log('\n pnpm run dev \n')
  })
}
const program = new Command()

program
  .name(Object.keys(pkg.bin)[0])
  .description(pkg.description)
  .version(pkg.version, '-v --version', '🎈版本信息~')
  .helpOption('-h --help', '❓帮助信息~')
  .command('create')
  .argument('<name>', '✨ 项目名称~')
  .option('-f --force', '🕹️强制覆盖同名目录~')
  .action((name: string, options: any) => {
    create(name, options)
  })

// 解析参数
program.parse(process.argv)
