package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体，对应数据表 user。
 */
@Data
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录账号：用户名（3-20 位字母、数字或下划线） */
    private String account;

    /** BCrypt 加密后的密码 */
    private String password;

    /** 昵称 */
    private String nickname;

    /** 头像（emoji；空串=用昵称首字作文字头像） */
    private String avatar;

    /** 性别：男/女/空 */
    private String gender;

    /** 手机号 */
    private String phone;

    /** 个性签名 */
    private String bio;

    /** 账号类型：0=用户名 1=手机 2=邮箱 */
    private Integer accountType;

    /** 状态：1=正常 0=禁用 */
    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
