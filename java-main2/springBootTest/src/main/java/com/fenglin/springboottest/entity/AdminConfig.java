package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 后台配置表：以 JSON 文本存储导航 / 搜索 / 推荐三类配置。
 * config_key 为主键（nav / search / recommend），config_value 为 JSON 字符串。
 */
@Data
@TableName("admin_config")
public class AdminConfig {

    @TableId(value = "config_key", type = IdType.INPUT)
    private String configKey;

    @TableField("config_value")
    private String configValue;
}
