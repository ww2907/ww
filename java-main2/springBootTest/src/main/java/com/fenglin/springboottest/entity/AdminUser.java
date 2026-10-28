package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 用户信息（后台「用户管理」展示用，不含密码字段，避免泄露）。
 */
@Data
@TableName("admin_user")
public class AdminUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String account;

    private String nickname;

    /** 账号类型：0=用户名 1=手机 2=邮箱 */
    private Integer accountType;

    /** 状态：1=正常 0=禁用 */
    private Integer status;

    private String createdAt;
}
