package com.tinyml.gateway.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 模拟设备层核心控制器。
 *
 * 设计原则：设备层“只能接收”前端发来的数据，不做真实业务处理，
 * 仅把收到的内容格式化后打印到终端，从而在终端上实现仿真。
 *
 * 统一入口：
 *   POST /api/device/{category}            —— 保存某类配置（如 network / sensor）
 *   POST /api/device/{category}/{action}   —— 触发某类动作（如 modbus/scan、system/reboot）
 */
@RestController
@RequestMapping("/api")
public class DeviceLayerController {

    private static final Logger log = LoggerFactory.getLogger(DeviceLayerController.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /**
     * 接收“配置保存”类数据。
     */
    @PostMapping("/device/{category}")
    public Map<String, Object> receiveConfig(@PathVariable String category,
                                             @RequestBody(required = false) String body) {
        String target = category;
        printReceived(target, body);
        return ack(target);
    }

    /**
     * 接收“动作/指令”类数据。
     */
    @PostMapping("/device/{category}/{action}")
    public Map<String, Object> receiveAction(@PathVariable String category,
                                             @PathVariable String action,
                                             @RequestBody(required = false) String body) {
        String target = category + "/" + action;
        printReceived(target, body);
        return ack(target);
    }

    /**
     * 健康检查，供前端探测设备层是否在线。
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", "UP");
        res.put("service", "tinyml-gateway-backend (设备层)");
        res.put("timestamp", LocalDateTime.now().format(TIME_FMT));
        return res;
    }

    /**
     * 将收到的数据打印到终端。
     */
    private void printReceived(String target, String body) {
        String pretty = pretty(body);
        String time = LocalDateTime.now().format(TIME_FMT);

        System.out.println();
        System.out.println("================================================================================");
        System.out.println("[设备层] " + time + "  <== 收到前端数据 : " + target);
        System.out.println("--------------------------------------------------------------------------------");
        if (pretty == null || pretty.isBlank()) {
            System.out.println("(空数据)");
        } else {
            System.out.println(pretty);
        }
        System.out.println("================================================================================");
        System.out.flush();

        log.info("设备层接收 -> {} | {}", target, pretty == null ? "(空)" : pretty.replaceAll("\\s+", " "));
    }

    /**
     * 尽力把请求体美化成 JSON；失败时原样返回。
     */
    private String pretty(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode node = MAPPER.readTree(body);
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(node);
        } catch (Exception e) {
            return body;
        }
    }

    /**
     * 统一应答，告知前端设备层已收到数据。
     */
    private Map<String, Object> ack(String target) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("message", "设备层已接收: " + target);
        res.put("timestamp", LocalDateTime.now().format(TIME_FMT));
        return res;
    }
}
