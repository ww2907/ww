package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.AdminCategory;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminCategoryMapper extends BaseMapper<AdminCategory> {
}
