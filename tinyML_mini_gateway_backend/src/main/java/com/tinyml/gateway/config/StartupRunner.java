package com.tinyml.gateway.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 启动后打印一段说明，方便在终端识别设备层是否就绪。
 */
@Component
public class StartupRunner implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        System.out.println();
        System.out.println("################################################################################");
        System.out.println("#  TinyML 网关模拟设备层已启动                                                    #");
        System.out.println("#  监听端口 : 8090                                                                #");
        System.out.println("#  说明     : 仅接收前端数据并在终端打印（不做真实业务处理）                       #");
        System.out.println("#  健康检查 : GET  http://localhost:8090/api/health                              #");
        System.out.println("#  数据入口 : POST http://localhost:8090/api/device/{category}[/{action}]        #");
        System.out.println("################################################################################");
        System.out.flush();
    }
}
