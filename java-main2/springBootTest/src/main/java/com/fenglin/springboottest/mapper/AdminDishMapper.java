package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.AdminDish;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminDishMapper extends BaseMapper<AdminDish> {
}
