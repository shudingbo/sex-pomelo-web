English | [简体中文](./README.zh-CN.md)

**Sex-pomelo ( Pomelo ) Web 管理框架**

这是针对 Sex-pomelo [sex-pomelo](https://github.com/sex-pomelo/sex-pomelo)( [pomelo](https://github.com/NetEase/pomelo) ) 的web管理框架。 本框架是 pomelo-cli的增强web版本。

![shell](https://github.com/shudingbo/mypictures/blob/master/sex-pomelo-web/shell.png?raw=true)

# 特色
## 图形化管理
可以对服务器（物理机子）和 服务（每个pomelo server）进行管理
  * node服务的开启，停止；
  * 支持 基于node 服务类型(ServerType)的开启，停止,移动(可以移动服务器到另一个物理服务器; 
  * 支持 基于服务器的 node 服务开启，停止;

## sex-pomelo-cli（pomelo）命令全支持
```
?   symbol for help
help   display the help
quit   quit pomelo-cli
kill   kill all servers
exec   exec script files
get   equal to app.get(key) 
set   equal to app.set(key, value)
add   add server to pomelo clusters
stop   stop server. Takes serverId as argument
show   show infos like : user, servers, connections
use   use another server. Takes serverId as argument
enable   enable an admin console module or enable app settings
disable   disable an admin console module or disable app settings
dump   make a dump of the V8 heap and cpu for later inspection
addCron   add cron for server
removeCron   remove cron for server
blacklist  add blacklist for frontend server
run  run script in server
execStr   exec script String
systemInfo  show server systeminfo
nodeInfo  show node info
monitorLog  get Log
```

![shell Icon](https://github.com/shudingbo/mypictures/blob/master/sex-pomelo-web/shell-icon.png?raw=true)




