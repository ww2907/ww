package com.fenglin.springboottest.service;

import java.util.Map;

/**
 * 鉴权业务：图片验证码由 {@link CaptchaService} 提供。
 * 账号为用户名（3-20 位字母、数字或下划线），与前端 src/api/auth.js 的规则一致。
 */
public interface AuthService {

    /**
     * 注册：校验图片验证码后创建账号。
     * 返回 { account, nickname, token }
     */
    Map<String, Object> register(String account, String password, String nickname,
                                 String captchaId, String captchaCode);

    /**
     * 登录：校验图片验证码后校验账号密码。
     * 返回 { token, account, nickname }
     */
    Map<String, Object> login(String account, String password,
                              String captchaId, String captchaCode);

    /**
     * 找回密码：校验图片验证码后直接重置新密码。
     * 返回 { success: true, account }
     */
    Map<String, Object> resetPassword(String account, String newPassword,
                                      String captchaId, String captchaCode);
}
