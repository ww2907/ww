package com.fenglin.springboottest.vo;

import lombok.Data;

/**
 * 个人资料展示对象，与前端 src/store/profile.js 的 profile 结构一致：
 *   { account, nickname, avatar, gender, phone, bio }
 */
@Data
public class UserProfileVO {

    private String account;

    private String nickname;

    /** 头像 emoji；空串表示使用文字头像（昵称首字） */
    private String avatar;

    /** 男 / 女 / 空 */
    private String gender;

    private String phone;

    /** 个性签名 */
    private String bio;
}
