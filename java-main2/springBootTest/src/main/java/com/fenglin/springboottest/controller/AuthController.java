package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.AuthRequest;
import com.fenglin.springboottest.service.AuthService;
import com.fenglin.springboottest.service.CaptchaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 鉴权接口，统一挂在 /api/auth 下，与前端 src/api/auth.js 的 ENDPOINTS 约定一致。
 * 登录 / 注册 / 找回密码均使用图片验证码：
 *   1) POST /api/auth/captcha  获取 { captchaId, image(base64 data URL) }；
 *   2) 提交业务请求时携带 captchaId + captchaCode，后端一次性消费校验。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;

    @Autowired
    public AuthController(AuthService authService, CaptchaService captchaService) {
        this.authService = authService;
        this.captchaService = captchaService;
    }

    /** 获取图片验证码：POST /api/auth/captcha */
    @PostMapping("/captcha")
    public Result<?> captcha() {
        return Result.success(captchaService.generate());
    }

    /** 注册：POST /api/auth/register */
    @PostMapping("/register")
    public Result<?> register(@RequestBody AuthRequest req) {
        return Result.success(authService.register(
                req.getAccount(), req.getPassword(), req.getNickname(),
                req.getCaptchaId(), req.getCaptchaCode()));
    }

    /** 登录：POST /api/auth/login */
    @PostMapping("/login")
    public Result<?> login(@RequestBody AuthRequest req) {
        return Result.success(authService.login(
                req.getAccount(), req.getPassword(),
                req.getCaptchaId(), req.getCaptchaCode()));
    }

    /** 找回密码（校验图片验证码后直接重置）：POST /api/auth/forgot */
    @PostMapping("/forgot")
    public Result<?> forgot(@RequestBody AuthRequest req) {
        return Result.success(authService.resetPassword(
                req.getAccount(), req.getNewPassword(),
                req.getCaptchaId(), req.getCaptchaCode()));
    }
}
