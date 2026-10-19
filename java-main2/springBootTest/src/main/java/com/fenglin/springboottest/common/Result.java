package com.fenglin.springboottest.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一接口返回结构。
 * 前端约定：{ code: 0, message: 'ok', data: {...} }，code === 0 视为成功。
 */
@Data
public class Result<T> implements Serializable {

    /** 0 表示成功，非 0 表示业务失败 */
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 0;
        r.message = "ok";
        r.data = data;
        return r;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        return r;
    }
}
