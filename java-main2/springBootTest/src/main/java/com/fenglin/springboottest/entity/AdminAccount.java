package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 后台管理员账号（密码使用 BCrypt 加密存储）。
 */
@Data
@TableName("admin_account")
public class AdminAccount {

    @TableId(value = "account", type = IdType.INPUT)
    private String account;

    private String password;
}
