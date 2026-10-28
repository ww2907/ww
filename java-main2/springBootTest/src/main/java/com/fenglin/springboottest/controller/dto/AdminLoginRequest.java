package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/**
 * 后台管理员登录请求体：{ account, password }。
 */
@Data
public class AdminLoginRequest {
    private String account;
    private String password;
}
