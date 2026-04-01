const express = require('express')
const os = require('os')
const app = express()
const PORT = 3001

// 计算CPU使用率（通过top命令直接读取实时值）
function getCpuUsage() {
    try {
        const { execSync } = require('child_process')
        // 执行top命令取瞬时CPU使用率，取空闲率然后100减
        const topOutput = execSync('top -bn1 | grep "%Cpu(s)"', { encoding: 'utf8' })
        const idleMatch = topOutput.match(/(\d+\.\d+)\s+id/)
        if (idleMatch) {
            const idle = parseFloat(idleMatch[1])
            return Math.round(100 - idle)
        }
        // 备用方案：用mpstat
        const mpstatOutput = execSync('mpstat 1 1 | grep "Average"', { encoding: 'utf8' })
        const mpstatIdleMatch = mpstatOutput.match(/(\d+\.\d+)\s*$/)
        if (mpstatIdleMatch) {
            const idle = parseFloat(mpstatIdleMatch[1])
            return Math.round(100 - idle)
        }
        return 0
    } catch (e) {
        return 0
    }
}

// 允许跨域
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

// 服务器状态接口
app.get('/api/server-status', (req, res) => {
    // CPU使用率计算（实时）
    const cpuUsage = getCpuUsage()

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
