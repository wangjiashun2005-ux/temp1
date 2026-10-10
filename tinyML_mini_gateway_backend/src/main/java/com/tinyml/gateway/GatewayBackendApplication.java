package com.tinyml.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * TinyML 网关模拟设备层启动类。
 *
 * 该服务只做一件事：接收前端 Web 页面发来的配置/指令数据，
 * 并在终端（控制台）打印出来，以此模拟真实设备层的行为。
 */
@SpringBootApplication
public class GatewayBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayBackendApplication.class, args);
    }
}
