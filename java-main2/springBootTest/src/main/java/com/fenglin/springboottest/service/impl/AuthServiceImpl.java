package com.fenglin.springboottest.service.impl;

import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.service.AuthService;
import com.fenglin.springboottest.service.CaptchaService;
import com.fenglin.springboottest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 鉴权实现：
 *  - 验证方式为图片验证码（CaptchaService 生成并一次性消费）；
 *  - 账号为用户名（3-20 位字母、数字或下划线），与前端规则一致；
 *  - 密码 6-12 位，BCrypt 加密存储。
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final CaptchaService captchaService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /** 用户名规则：与前端 src/api/auth.js 的 validAccount 保持一致 */
    private static final Pattern USERNAME = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");

    @Autowired
    public AuthServiceImpl(UserService userService, CaptchaService captchaService) {
        this.userService = userService;
        this.captchaService = captchaService;
    }

    private void checkAccount(String account) {
        if (account == null || !USERNAME.matcher(account).matches()) {
            throw new BusinessException("用户名需为3-20位字母、数字或下划线");
        }
    }

    private void checkPassword(String password) {
        if (password == null || password.length() < 6 || password.length() > 12) {
            throw new BusinessException("密码长度需为6-12位");
        }
    }

    @Override
    public Map<String, Object> register(String account, String password, String nickname,
                                        String captchaId, String captchaCode) {
        checkAccount(account);
        checkPassword(password);
        // 图片验证码：一次性消费，错误/过期/已用都会抛业务异常
        captchaService.validate(captchaId, captchaCode);

        if (userService.lambdaQuery().eq(User::getAccount, account).count() > 0) {
            throw new BusinessException("该用户名已被注册");
        }

        User user = new User();
        user.setAccount(account);
        user.setPassword(encoder.encode(password));
        user.setNickname((nickname == null || nickname.isBlank()) ? "美食家" : nickname.trim());
        user.setAccountType(0); // 0=用户名
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userService.save(user);

        Map<String, Object> result = new HashMap<>(4);
        result.put("account", account);
        result.put("nickname", user.getNickname());
        result.put("token", UUID.randomUUID().toString());
        return result;
    }

    @Override
    public Map<String, Object> login(String account, String password,
                                      String captchaId, String captchaCode) {
        checkAccount(account);
        captchaService.validate(captchaId, captchaCode);

        User user = userService.lambdaQuery().eq(User::getAccount, account).one();
        if (user == null || !encoder.matches(password, user.getPassword())) {
            throw new BusinessException("账号或密码错误");
        }

        Map<String, Object> result = new HashMap<>(4);
        result.put("token", UUID.randomUUID().toString());
        result.put("account", account);
        result.put("nickname", user.getNickname());
        return result;
    }

    @Override
    public Map<String, Object> resetPassword(String account, String newPassword,
                                              String captchaId, String captchaCode) {
        checkAccount(account);
        checkPassword(newPassword);
        captchaService.validate(captchaId, captchaCode);

        User user = userService.lambdaQuery().eq(User::getAccount, account).one();
        if (user == null) {
            throw new BusinessException("该账号不存在");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userService.updateById(user);

        Map<String, Object> result = new HashMap<>(4);
        result.put("success", true);
        result.put("account", account);
        return result;
    }
}
