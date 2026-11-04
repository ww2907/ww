package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/**
 * 更新个人资料请求体：PUT /api/users/profile
 * account 为当前登录账号（必填），其余字段为空表示不修改。
 */
@Data
public class UserProfileUpdateRequest {

    private String account;

    private String nickname;

    private String avatar;

    private String gender;

    private String phone;

    private String bio;
}
