package com.fenglin.springboottest.entity;

import lombok.Data;

/**
 * 后台「用户管理」视图对象（非数据库实体）。
 *
 * 数据来自真实注册用户表 {@code user}，由 {@code AdminService} 装配，
 * 用来同时承担「列表展示」与「资料编辑入参」两个角色：
 *  - 展示：id / account / nickname / avatar / gender / phone / bio / accountType / status / createdAt / addressCount
 *  - 编辑：只有 nickname / avatar / gender / phone / bio / status 会被写回，其余字段忽略
 *
 * 刻意不含 password 字段，避免任何接口把密码（BCrypt 摘要）回传给前端。
 */
@Data
public class AdminUser {

    /** 用户主键（user.id） */
    private Long id;

    /** 登录账号 */
    private String account;

    /** 昵称 */
    private String nickname;

    /** 头像（emoji；空串=用昵称首字作文字头像） */
    private String avatar;

    /** 性别：男 / 女 / 空串 */
    private String gender;

    /** 手机号 */
    private String phone;

    /** 个性签名 */
    private String bio;

    /** 账号类型：0=用户名 1=手机 2=邮箱 */
    private Integer accountType;

    /** 状态：1=正常 0=禁用 */
    private Integer status;

    /** 注册时间，格式 yyyy-MM-dd HH:mm:ss（与后台表格展示一致） */
    private String createdAt;

    /** 收货地址数量（只读统计，不落库） */
    private Integer addressCount;
}
