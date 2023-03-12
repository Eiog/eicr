#! /usr/bin/env node
import path from 'node:path'
import https from 'node:https'
import chalk from 'chalk'
import { Command } from 'commander'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import download from 'download-git-repo'
import ora from 'ora'
import store from '../store.json'
import pkg from '../package.json'
const storeUri = 'https://raw.githubusercontent.com/Eiog/eicr/main/store.json'
const fetchStore = (url: string) => {
  return new Promise((resolve, reject) => {
    https.request({ method: 'GET', hostname: 'https://raw.githubusercontent.com', path: '/Eiog/eicr/main/store.json', port: 443 }, (res) => {
      res.on('data', (data) => {
        console.log(data)
      })
      res.on('error', (err) => {
        console.log(error)
      })
    }).end()
  })
}
fetchStore(storeUri)

const create = async (name: string, options: any) => {
  // 1.获取当前位置（当前输入命令行的位置）
  const cwd = process.cwd()

  // 2.需要创建的文件（在当前输入命名的位置进行创建）
  const targetPath = path.join(cwd, name)

  // 3.通过交互式命令行，选择我们要创建的模版
  const { projectName } = await inquirer.prompt({
    name: 'projectName',
    type: 'list',
    choices: store,
    message: '请选择一个项目模版进行创建~😉',
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
          message: `项目已存在、是否确认覆盖? ${chalk.grey(
              '覆盖后原项目无法恢复',
            )}`,
          choices: [
            { name: '确认覆盖', value: true },
            { name: '再考虑下，暂不覆盖', value: false },
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
    console.log(err)
    if (err) {
      console.log(chalk.red('下载失败了~😧'))
      spinner.fail('下载失败了~😧')
      return false
    }
    spinner.succeed()
    console.log(`${chalk.green('\n 项目创建成功~🥰')}  ${chalk.cyan(name)}`)
    console.log(`\n cd ${chalk.cyan(name)}`)
    console.log('\n pnpm install')
    console.log('\n pnpm run dev \n')
  })
}
const program = new Command()

// 创建文件命令
program
  .command('<project-name>')
  .description('创建一个新项目~🤪')
  .option('-f --force', '强制覆盖同名目录~😌')
  .action((name: string, options: any) => {
    create(name, options)
  })

// 配置版本号信息
program.version(pkg.version).usage('<command> [option]')

// 配置帮助信息
program.on('--help', () => {
  console.log(
    `\r\n Run ${chalk.green('antrioe <command> --help')} 查看帮助 \r\n `,
  )
})

// 解析参数
program.parse(process.argv)
