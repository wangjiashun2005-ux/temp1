# Java 开发环境使用指南

> 一套**免安装 IDE、纯命令行**的 Java 开发环境。
> 所有依赖、构建产物、缓存**只写入单一目录** `D:\development\111111111`，不污染系统其它位置。

---

## 0. 设计原则：单一目录

本环境刻意做成**便携式（portable）**，核心目的是"自包含"：

- **所有写入都发生在** `D:\development\111111111` 之内：
  - Maven 依赖缓存 → `D:\development\111111111\.m2repo`
  - Maven 程序本体 → `D:\development\111111111\tools\apache-maven-3.9.16`
  - 你的项目代码 → `D:\development\111111111\<你的项目>`
  - 日志、脚本 → `D:\development\111111111\tools`
- 环境依赖的 **JDK 和 Mosquitto** 是系统级只读使用，**不写入**。
- 删除整个 `D:\development\111111111` 即可干净卸载（不留残留）。

> 换一台电脑时，只要保证 JDK 17 就位，把 `D:\development\111111111` 整个目录拷过去即可，无需重新配置 Maven。

---

## 1. 环境概览

| 组件 | 路径 | 说明 |
|------|------|------|
| JDK | `C:\Program Files\Java\latest\jdk-17` | Java 17（系统级，只读使用） |
| JAVA_HOME | 用户环境变量 → 上表路径 | Maven 依赖此变量找到 JDK |
| Maven（便携版） | `D:\development\111111111\tools\apache-maven-3.9.16` | 免安装，未加入 PATH |
| Maven 配置文件 | `D:\development\111111111\tools\settings.xml` | 国内镜像 + 本地仓库路径 |
| 本地仓库 | `D:\development\111111111\.m2repo` | 依赖缓存，**只写这里** |
| MQTT Broker | `D:\Program Files\Mosquitto\mosquitto.exe` | 系统级，只读使用（可选） |

**关键设计**：Maven 本身**不**装进系统、**不**加入 PATH；而是通过 `settings.xml` 把本地仓库指向单一目录。这样"构建"这个动作的所有落盘都在目录内。

---

## 2. 前置检查

在命令行执行（PowerShell 或 CMD）：

```powershell
java -version
```

应输出 `java version "17.x"`。若不是 17，请先安装 JDK 17，并把 `JAVA_HOME` 指向 JDK 目录：

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME","C:\Program Files\Java\latest\jdk-17","User")
```

> 修改环境变量后需**新开终端**才生效。

验证 Maven 可用的完整命令（无需装系统 Maven）：

```powershell
& "D:\development\111111111\tools\apache-maven-3.9.16\bin\mvn.cmd" -s "D:\development\111111111\tools\settings.xml" -version
```

正常会显示：`Apache Maven 3.9.16` ... `Java version: 17.x` ... `Maven home: D:\development\111111111\tools\apache-maven-3.9.16`。

---

## 3. 为什么每次都要带 `-s`？

`settings.xml` 是本环境的核心，它做了两件事：

```xml
<localRepository>D:/development/111111111/.m2repo</localRepository>   <!-- 依赖只写这里 -->
<mirrors>
    <mirror>
        <id>aliyunmaven</id>
        <url>https://maven.aliyun.com/repository/public</url>          <!-- 国内源，下载快 -->
        <mirrorOf>*</mirrorOf>
    </mirror>
</mirrors>
```

- `<localRepository>`：把默认的 `用户目录\.m2` 改到**单一目录内**，满足"只向一处写"。
- `<mirrorOf>*</mirrorOf>`：所有依赖都从**阿里云**下载，国内速度快，且不需要翻墙访问 Maven Central。

因为没加入 PATH，调用时必须显式指定这两条路径。

---

## 4. 常用命令速查

把下面三行理解为"本环境的三大件"：

```powershell
$MVN = "D:\development\111111111\tools\apache-maven-3.9.16\bin\mvn.cmd"
$SET = "D:\development\111111111\tools\settings.xml"
$PRJ = "D:\development\111111111\<你的项目>\pom.xml"
```

| 目的 | 命令 |
|------|------|
| 清理并打包 | `& $MVN -s $SET -f $PRJ clean package` |
| 打包（跳过测试） | `& $MVN -s $SET -f $PRJ clean package -DskipTests` |
| 安装到本地仓库 | `& $MVN -s $SET -f $PRJ clean install` |
| 查看依赖树 | `& $MVN -s $SET -f $PRJ dependency:tree` |
| 导出依赖 classpath | `& $MVN -s $SET -f $PRJ dependency:build-classpath "-Dmdep.outputFile=D:\development\111111111\tools\cp.txt" "-DincludeScope=runtime"` |

> **`-f`**：指向某个项目的 `pom.xml`，可在任意当前目录下构建该项目。

---

## 5. 新建一个 Java 项目（从零开始）

### 5.1 目录结构

```
D:\development\111111111\myapp\
├── pom.xml
└── src\
    └── main\
        └── java\
            └── com\example\App.java
```

### 5.2 最小 `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>myapp</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- 在这里声明依赖，坐标 = groupId:artifactId:version -->
        <!-- 例：
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.17.2</version>
        </dependency>
        -->
    </dependencies>
</project>
```

### 5.3 示例代码 `src\main\java\com\example\App.java`

```java
package com.example;

public class App {
    public static void main(String[] args) {
        System.out.println("Hello, portable Java!");
    }
}
```

### 5.4 构建与运行

```powershell
$MVN = "D:\development\111111111\tools\apache-maven-3.9.16\bin\mvn.cmd"
$SET = "D:\development\111111111\tools\settings.xml"

# 编译打包
& $MVN -s $SET -f D:\development\111111111\myapp\pom.xml clean package

# 运行（普通 jar：classpath 指向编译出的 classes 目录）
java -cp D:\development\111111111\myapp\target\classes com.example.App
```

---

## 6. 依赖是怎么"手动管理"的

不需要用 IDE 点选，也不需要手动到网上下载 jar。流程是：

1. **声明**：在 `pom.xml` 的 `<dependencies>` 里写坐标 `groupId:artifactId:version`。
2. **自动下载**：执行构建时，Maven 自动从阿里云镜像下载到 `.m2repo`。
3. **自动进 classpath**：编译/运行时 Maven 自动把依赖接入。

### 6.1 依赖找不找得到，取决于坐标

- 到 <https://mvnrepository.com> 搜索库名，找到 `groupId / artifactId / version`，复制进 pom 即可。
- 有传递依赖时 Maven 会**自动**把依赖的依赖也拉下来，无需你操心。

### 6.2 项目 A 依赖项目 B（本地多模块）

如果 `myapp` 要用另一个本地项目 `b-lib` 的类：

```powershell
# 1) 先把 B 装进本地仓库
& $MVN -s $SET -f D:\development\111111111\b-lib\pom.xml clean install

# 2) 在 A 的 pom.xml 里引用 B 的坐标
#    <dependency>
#        <groupId>com.example</groupId>
#        <artifactId>b-lib</artifactId>
#        <version>1.0-SNAPSHOT</version>
#    </dependency>
```

> 这正是本目录里 `iot-platform` 依赖 `device-simulator` 的做法：先 `install` 模拟器，平台才能引用。

### 6.3 引入"无法从仓库获取"的第三方 jar

```powershell
& $MVN -s $SET install:install-file `
  "-Dfile=D:\development\111111111\libs\some.jar" `
  "-DgroupId=com.foo" "-DartifactId=some" "-Dversion=1.0" "-Dpackaging=jar"
```

之后在 pom 里按 `com.foo:some:1.0` 引用。

---

## 7. 运行 jar 的两种方式

**方式一：可执行胖 jar（含所有依赖）—— 直接 `java -jar`**

```powershell
java -jar D:\development\111111111\myapp\target\myapp-1.0-SNAPSHOT.jar
```

判断能不能 `java -jar`：看 jar 的清单里有没有 `Main-Class`：

```powershell
jar tf myapp-1.0-SNAPSHOT.jar | findstr META-INF
```

Spring Boot 项目用 `spring-boot-maven-plugin` 打出的就是这种胖包。

**方式二：普通 jar（不含依赖）—— 手动指定 classpath**

```powershell
java -cp "D:\development\111111111\myapp\target\classes;<依赖jar1;依赖jar2;...>" com.example.App
```

用 4 节里的 `dependency:build-classpath` 自动生成 classpath 文件，再用 `;` 拼接最省事：

```powershell
$cp = "D:\development\111111111\myapp\target\classes;" + (Get-Content "D:\development\111111111\tools\cp.txt" -Raw).Trim()
java -cp $cp com.example.App
```

---

## 8. 门面：一键后台/新窗口运行

若要让程序**开独立控制台窗口**运行（便于观察日志），在 PowerShell 里：

```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList '/c','start "MyApp" java -jar D:\...\myapp.jar'
```

若要**后台静默**运行并记录日志：

```powershell
Start-Process java -ArgumentList '-jar','D:\...\myapp.jar' `
  -RedirectStandardOutput 'D:\development\111111111\tools\myapp.out.log' `
  -RedirectStandardError  'D:\development\111111111\tools\myapp.err.log' `
  -WindowStyle Hidden
```

---

## 9. 常见坑与解决方法

| 现象 | 原因 | 解决 |
|------|------|------|
| `-Dmaven.test.skip=true` 被拆开报 `Unknown lifecycle phase ".test.skip=true"` | PowerShell 把 `=`/`.` 拆参 | 给整个参数**加引号**：`"-Dmaven.test.skip=true"` |
| 构建时测试编译失败（找不到 junit 等） | pom 缺少测试依赖，但源码里有测试 | 跳过测试：`-DskipTests` 或 `"-Dmaven.test.skip=true"` |
| `mvn` 不是内部命令 | 便携版未入 PATH | 用完整路径 `...\apache-maven-3.9.16\bin\mvn.cmd` |
| Maven 找不到 JDK | `JAVA_HOME` 未设或未生效 | 设用户级 `JAVA_HOME` 后**重开终端** |
| 下载依赖卡住 | 未指定镜像 | 务必带 `-s settings.xml` |
| 关掉终端后程序没了 | 前台运行随终端结束 | 用 `Start-Process -WindowStyle Hidden` 或 `start` 开新窗口 |

> 注意路径含空格时用双引号包裹；`mvn.cmd` 里的中文提示若显示乱码是 GBK 控制台编码问题，不影响功能。

---

## 10. 目录结构总览

```
D:\development\111111111\              ← 唯一写入目录
├── .m2repo\                           ← Maven 依赖缓存（自动生成）
├── tools\
│   ├── apache-maven-3.9.16\           ← 便携版 Maven
│   ├── settings.xml                   ← 镜像 + 本地仓库配置（核心）
│   ├── mosquitto.conf                 ← MQTT broker 配置（可选）
│   ├── run-*.cmd                      ← 示例启动脚本
│   └── *.log                          ← 运行日志
├── mqtt-lab-master\                   ← 示例项目（物联网实验）
└── <你的项目>\                        ← 在此放新项目
```

---

## 11. 一页速记卡

```powershell
# —— 环境三件套 ——
$MVN = "D:\development\111111111\tools\apache-maven-3.9.16\bin\mvn.cmd"
$SET = "D:\development\111111111\tools\settings.xml"

# —— 最常用 ——
& $MVN -s $SET -f <项目pom.xml> clean package        # 打包
& $MVN -s $SET -f <项目pom.xml> clean install        # 装到本地仓库
& $MVN -s $SET -f <项目pom.xml> dependency:tree      # 看依赖

# —— 运行 ——
java -jar <胖jar>                                    # 含依赖
java -cp "<classes;依赖>" <主类全名>                 # 普通jar

# —— 原则 ——
# 只写 D:\development\111111111；依赖声明进 pom.xml；下载走阿里云镜像
```
