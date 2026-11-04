package com.fenglin.springboottest.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.controller.dto.UserAddressRequest;
import com.fenglin.springboottest.controller.dto.UserProfileUpdateRequest;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.entity.UserAddress;
import com.fenglin.springboottest.mapper.UserAddressMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import com.fenglin.springboottest.service.UserProfileService;
import com.fenglin.springboottest.vo.UserAddressVO;
import com.fenglin.springboottest.vo.UserProfileVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 个人资料 + 收货地址实现：
 *   - 资料读写落在 user 表（avatar/gender/phone/bio 为本次新增字段）；
 *   - 地址读写落在 user_address 表，同一账号默认地址唯一。
 */
@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserMapper userMapper;
    private final UserAddressMapper addressMapper;

    public UserProfileServiceImpl(UserMapper userMapper, UserAddressMapper addressMapper) {
        this.userMapper = userMapper;
        this.addressMapper = addressMapper;
    }

    // ==================== 资料 ====================

    @Override
    public UserProfileVO getProfile(String account) {
        User u = requireUser(account);
        return toProfileVO(u);
    }

    @Override
    public UserProfileVO updateProfile(UserProfileUpdateRequest req) {
        if (req == null) {
            throw new BusinessException("缺少资料信息");
        }
        User u = requireUser(req.getAccount());

        if (req.getNickname() != null) {
            String nickname = req.getNickname().trim();
            if (nickname.isEmpty()) {
                nickname = u.getAccount();
            }
            if (nickname.length() > 20) {
                throw new BusinessException("昵称不能超过 20 个字符");
            }
            u.setNickname(nickname);
        }
        if (req.getAvatar() != null) {
            u.setAvatar(trim(req.getAvatar()));
        }
        if (req.getGender() != null) {
            String g = trim(req.getGender());
            if (!g.isEmpty() && !"男".equals(g) && !"女".equals(g)) {
                throw new BusinessException("性别只能为 男 / 女 / 空");
            }
            u.setGender(g);
        }
        if (req.getPhone() != null) {
            String phone = trim(req.getPhone());
            if (phone.length() > 20) {
                throw new BusinessException("手机号过长");
            }
            u.setPhone(phone);
        }
        if (req.getBio() != null) {
            String bio = trim(req.getBio());
            if (bio.length() > 128) {
                throw new BusinessException("个性签名不能超过 128 个字符");
            }
            u.setBio(bio);
        }

        u.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(u);
        return toProfileVO(u);
    }

    // ==================== 地址 ====================

    @Override
    public List<UserAddressVO> listAddresses(String account) {
        List<UserAddressVO> result = new ArrayList<>();
        if (isBlank(account)) {
            return result;
        }
        List<UserAddress> list = addressMapper.selectList(new QueryWrapper<UserAddress>()
                .eq("account", account.trim())
                .orderByDesc("is_default")
                .orderByDesc("id"));
        for (UserAddress a : list) {
            result.add(toAddressVO(a));
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserAddressVO addAddress(UserAddressRequest req) {
        if (req == null || isBlank(req.getAccount())) {
            throw new BusinessException("缺少账号信息");
        }
        validateAddress(req);
        String account = req.getAccount().trim();

        boolean asDefault = Boolean.TRUE.equals(req.getIsDefault());
        if (asDefault) {
            clearDefault(account);
        }

        UserAddress a = new UserAddress();
        a.setAccount(account);
        a.setName(trim(req.getName()));
        a.setPhone(trim(req.getPhone()));
        a.setTag(isBlank(req.getTag()) ? "家" : trim(req.getTag()));
        a.setProvince(trim(req.getProvince()));
        a.setCity(trim(req.getCity()));
        a.setDetail(trim(req.getDetail()));
        a.setIsDefault(asDefault ? 1 : 0);
        addressMapper.insert(a);
        return toAddressVO(a);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserAddressVO updateAddress(Long id, UserAddressRequest req) {
        if (id == null) {
            throw new BusinessException("缺少地址信息");
        }
        UserAddress a = addressMapper.selectById(id);
        if (a == null) {
            throw new BusinessException(404, "收货地址不存在");
        }
        if (req != null && !isBlank(req.getAccount()) && !req.getAccount().trim().equals(a.getAccount())) {
            throw new BusinessException("无权操作该地址");
        }
        if (req == null) {
            throw new BusinessException("缺少地址信息");
        }
        validateAddress(req);

        a.setName(trim(req.getName()));
        a.setPhone(trim(req.getPhone()));
        a.setTag(isBlank(req.getTag()) ? "家" : trim(req.getTag()));
        a.setProvince(trim(req.getProvince()));
        a.setCity(trim(req.getCity()));
        a.setDetail(trim(req.getDetail()));

        if (Boolean.TRUE.equals(req.getIsDefault())) {
            clearDefault(a.getAccount());
            a.setIsDefault(1);
        } else if (Boolean.FALSE.equals(req.getIsDefault())) {
            a.setIsDefault(0);
        }

        a.setUpdatedAt(LocalDateTime.now());
        addressMapper.updateById(a);
        return toAddressVO(a);
    }

    @Override
    public void removeAddress(Long id, String account) {
        if (id == null) {
            throw new BusinessException("缺少地址信息");
        }
        UserAddress a = addressMapper.selectById(id);
        if (a == null) {
            return;
        }
        if (!isBlank(account) && !account.trim().equals(a.getAccount())) {
            throw new BusinessException("无权操作该地址");
        }
        addressMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserAddressVO setDefault(Long id, String account) {
        if (id == null) {
            throw new BusinessException("缺少地址信息");
        }
        UserAddress a = addressMapper.selectById(id);
        if (a == null) {
            throw new BusinessException(404, "收货地址不存在");
        }
        if (!isBlank(account) && !account.trim().equals(a.getAccount())) {
            throw new BusinessException("无权操作该地址");
        }
        clearDefault(a.getAccount());
        a.setIsDefault(1);
        a.setUpdatedAt(LocalDateTime.now());
        addressMapper.updateById(a);
        return toAddressVO(a);
    }

    // ==================== 内部工具 ====================

    private User requireUser(String account) {
        if (isBlank(account)) {
            throw new BusinessException("缺少账号信息");
        }
        User u = userMapper.selectOne(new QueryWrapper<User>().eq("account", account.trim()));
        if (u == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return u;
    }

    private void validateAddress(UserAddressRequest req) {
        if (isBlank(req.getName())) {
            throw new BusinessException("请填写联系人");
        }
        if (isBlank(req.getPhone())) {
            throw new BusinessException("请填写联系电话");
        }
        if (isBlank(req.getDetail())) {
            throw new BusinessException("请填写详细地址");
        }
        if (req.getName().trim().length() > 20) {
            throw new BusinessException("联系人不能超过 20 个字符");
        }
        if (req.getPhone().trim().length() > 20) {
            throw new BusinessException("联系电话过长");
        }
        if (req.getDetail().trim().length() > 255) {
            throw new BusinessException("详细地址过长");
        }
    }

    /** 取消该账号下所有地址的默认标记 */
    private void clearDefault(String account) {
        addressMapper.update(null, new UpdateWrapper<UserAddress>()
                .eq("account", account)
                .set("is_default", 0));
    }

    private UserProfileVO toProfileVO(User u) {
        UserProfileVO vo = new UserProfileVO();
        vo.setAccount(u.getAccount());
        vo.setNickname(u.getNickname());
        vo.setAvatar(u.getAvatar() == null ? "" : u.getAvatar());
        vo.setGender(u.getGender() == null ? "" : u.getGender());
        vo.setPhone(u.getPhone() == null ? "" : u.getPhone());
        vo.setBio(u.getBio() == null ? "" : u.getBio());
        return vo;
    }

    private UserAddressVO toAddressVO(UserAddress a) {
        UserAddressVO vo = new UserAddressVO();
        vo.setId(a.getId());
        vo.setAccount(a.getAccount());
        vo.setName(a.getName());
        vo.setPhone(a.getPhone());
        vo.setTag(a.getTag());
        vo.setProvince(a.getProvince());
        vo.setCity(a.getCity());
        vo.setDetail(a.getDetail());
        vo.setIsDefault(a.getIsDefault() != null && a.getIsDefault() == 1);
        return vo;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String trim(String s) {
        return s == null ? "" : s.trim();
    }
}
