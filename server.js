const express = require('express')
const os = require('os')
const app = express()
const PORT = 3001

// 允许跨域
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

// 服务器状态接口
app.get('/api/server-status', (req, res) => {
    // CPU使用率计算
    const cpus = os.cpus()
    let totalIdle = 0, totalTick = 0
    cpus.forEach(cpu => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type]
        }
        totalIdle += cpu.times.idle
    })
    const idle = totalIdle / cpus.length
    const total = totalTick / cpus.length
    const cpuUsage = 100 - ~~(100 * idle / total)

    // 内存信息
    const memTotal = os.totalmem() / 1024 / 1024 / 1024
    const memUsed = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024
    const memUsage = (memUsed / memTotal) * 100

    // 磁盘信息（简单读取根目录）
    const { execSync } = require('child_process')
    let diskUsage = 0, diskTotal = 0, diskUsed = 0
    try {
        const dfOutput = execSync('df -h /', { encoding: 'utf8' }).split('\n')[1].split(/\s+/)
        diskTotal = parseFloat(dfOutput[1])
        diskUsed = parseFloat(dfOutput[2])
        diskUsage = parseFloat(dfOutput[4].replace('%', ''))
    } catch (e) {}

    // 运行时间
    const uptimeSeconds = os.uptime()
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}天${hours}时${minutes}分`

    res.json({
        cpuUsage,
        memTotal,
        memUsed,
        memUsage,
        diskTotal,
        diskUsed,
        diskUsage,
        uptime
    })
})

app.listen(PORT, () => {
    console.log(`服务器状态API运行在 http://localhost:${PORT}`)
})
