package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/**
 * 鉴权请求体，前端 auth.js 的 captcha / login / register / forgotPassword 共用。
 */
@Data
public class AuthRequest {
    private String account;
    private String password;

    /** 注册昵称（选填） */
    private String nickname;

    /** 找回密码：新密码 */
    private String newPassword;

    /** 图片验证码 ID（由 POST /api/auth/captcha 返回） */
    private String captchaId;

    /** 用户输入的图片验证码字符（4 位，忽略大小写） */
    private String captchaCode;
}
