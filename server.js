const express = require('express')
const os = require('os')
const app = express()
const PORT = 3001

function getCpuUsage() {
    try {
        const { execSync } = require('child_process')
        const output = execSync('mpstat -P ALL 1 1 | grep "all" | grep -v "Average"', { encoding: 'utf8' })
        const parts = output.trim().split(/\s+/)
        const idle = parseFloat(parts[parts.length - 1])
        return Math.round(100 - idle)
    } catch (e) {
        return 0
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

app.get('/api/server-status', (req, res) => {
    const cpuUsage = getCpuUsage()

    const memTotal = os.totalmem() / 1024 / 1024 / 1024
    const memUsed = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024
    const memUsage = Math.round((memUsed / memTotal) * 100)

    const { execSync } = require('child_process')
    let diskUsage = 0, diskTotal = 0, diskUsed = 0
    try {
        const dfOutput = execSync('df -h /', { encoding: 'utf8' }).split('\n')[1].split(/\s+/)
        diskTotal = parseFloat(dfOutput[1].replace('%', ''))
        diskUsed = parseFloat(dfOutput[2].replace('%', ''))
        diskUsage = parseFloat(dfOutput[4].replace('%', ''))
    } catch (e) {}

    const uptimeSeconds = os.uptime()
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}天${hours}时${minutes}分`

    res.json({
        cpuUsage,
        memUsage,
        diskUsage,
        uptime
    })
})

app.listen(PORT, () => {
    console.log(`服务器状态API运行在 http://localhost:${PORT}`)
})
