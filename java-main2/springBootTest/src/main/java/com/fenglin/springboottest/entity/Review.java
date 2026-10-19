package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评价实体，对应数据表 review（用户评价）。
 */
@Data
@TableName("review")
public class Review {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属店铺 id */
    private Long restaurantId;

    /** 评论人昵称 */
    private String userName;

    /** 评分（1-5） */
    private Integer rating;

    /** 评论内容 */
    private String content;

    /** 时间文案（如 3天前 / 刚刚） */
    private String dateLabel;

    private LocalDateTime createdAt;
}
