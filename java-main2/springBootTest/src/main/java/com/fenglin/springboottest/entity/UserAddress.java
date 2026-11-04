package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收货地址实体，对应数据表 user_address。
 * 前端 src/store/profile.js 的地址结构：{ name, phone, tag, province, city, detail, isDefault }
 */
@Data
@TableName("user_address")
public class UserAddress {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属用户账号 */
    private String account;

    /** 联系人 */
    private String name;

    /** 联系电话 */
    private String phone;

    /** 标签：家 / 公司 / 学校 / 其他 */
    private String tag;

    private String province;

    private String city;

    /** 详细地址 */
    private String detail;

    /** 是否默认：1=是 0=否（数据库 tinyint，对外用 boolean） */
    @TableField("is_default")
    private Integer isDefault;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
