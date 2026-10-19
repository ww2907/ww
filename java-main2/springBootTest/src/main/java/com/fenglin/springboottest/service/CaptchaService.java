package com.fenglin.springboottest.service;

import com.fenglin.springboottest.common.BusinessException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 图片验证码服务：
 *  1) generate()  生成 4 位字符验证码图片（PNG，base64 data URL），返回 { captchaId, image }；
 *  2) validate()  按 captchaId 校验用户输入，一次性消费（防止重放）。
 *
 * 验证码以 captchaId -> { code, expireAt } 形式存于内存（单机部署够用）；
 * 若未来多实例部署，可改存 Redis。有效期 5 分钟。
 */
@Service
public class CaptchaService {

    /** 去掉易混淆字符（0/O、1/I）的字符集 */
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    /** 验证码长度：与前端 src/api/auth.js 的 CAPTCHA_LEN 保持一致 */
    private static final int CODE_LENGTH = 4;

    /** 有效期：5 分钟 */
    private static final long TTL_MILLIS = 5 * 60 * 1000L;

    /** 图片尺寸：与前端 .captcha-img（128x38 展示区）匹配 */
    private static final int WIDTH = 132;
    private static final int HEIGHT = 44;

    /** 字符可选颜色（偏青绿，呼应前端主题） */
    private static final Color[] COLORS = {
            new Color(0x0d, 0x8f, 0x81),
            new Color(0x00, 0x9f, 0x8d),
            new Color(0x1f, 0x6f, 0xc9),
            new Color(0x2e, 0x8b, 0x57),
            new Color(0xb8, 0x55, 0x2e),
            new Color(0x6a, 0x4f, 0x9e)
    };

    private static final class Entry {
        final String code;
        final long expireAt;

        Entry(String code, long expireAt) {
            this.code = code;
            this.expireAt = expireAt;
        }
    }

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    /**
     * 生成图片验证码。
     *
     * @return { captchaId: "32位随机串", image: "data:image/png;base64,..." }
     */
    public Map<String, Object> generate() {
        // 顺手清理过期条目，避免内存缓慢膨胀
        long now = System.currentTimeMillis();
        store.entrySet().removeIf(e -> e.getValue().expireAt < now);

        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        String code = sb.toString();

        String captchaId = UUID.randomUUID().toString().replace("-", "");
        store.put(captchaId, new Entry(code, now + TTL_MILLIS));

        Map<String, Object> result = new HashMap<>(4);
        result.put("captchaId", captchaId);
        result.put("image", drawImage(code));
        return result;
    }

    /**
     * 校验验证码（忽略大小写），校验即消费——无论成败，该 captchaId 都作废，
     * 前端在失败后会自动刷新图片，与该行为约定一致。
     */
    public void validate(String captchaId, String captchaCode) {
        Entry entry = captchaId == null || captchaId.isBlank() ? null : store.remove(captchaId);
        if (entry == null) {
            throw new BusinessException("验证码已使用或不存在，请刷新图片后重试");
        }
        if (entry.expireAt < System.currentTimeMillis()) {
            throw new BusinessException("验证码已过期，请刷新图片后重试");
        }
        if (captchaCode == null || captchaCode.isBlank()
                || !entry.code.equalsIgnoreCase(captchaCode.trim())) {
            throw new BusinessException("验证码不正确");
        }
    }

    /** 用 AWT 绘制验证码图片并编码为 base64 data URL */
    private String drawImage(String code) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            // 1. 浅色背景
            g.setColor(new Color(0xf0, 0xfa, 0xf7));
            g.fillRect(0, 0, WIDTH, HEIGHT);

            // 2. 干扰弧线（颜色取字符色与白的混合，保证浅淡不抢主体）
            for (int i = 0; i < 5; i++) {
                Color c = COLORS[random.nextInt(COLORS.length)];
                g.setColor(new Color(
                        (c.getRed() + 255) / 2,
                        (c.getGreen() + 255) / 2,
                        (c.getBlue() + 255) / 2));
                int x1 = random.nextInt(WIDTH);
                int y1 = random.nextInt(HEIGHT);
                g.drawArc(x1 - 20, y1 - 20, 40 + random.nextInt(30), 40 + random.nextInt(30),
                        random.nextInt(180), 60 + random.nextInt(120));
            }

            // 3. 干扰噪点
            for (int i = 0; i < 60; i++) {
                Color c = COLORS[random.nextInt(COLORS.length)];
                g.setColor(c);
                g.fillRect(random.nextInt(WIDTH), random.nextInt(HEIGHT), 2, 2);
            }

            // 4. 逐字符绘制：随机颜色、轻微旋转、上下浮动
            g.setFont(new Font("Arial", Font.BOLD, 30));
            for (int i = 0; i < code.length(); i++) {
                float x = 18 + i * ((WIDTH - 30f) / CODE_LENGTH);
                float y = HEIGHT / 2f + 10 + (random.nextInt(9) - 4);
                double theta = (random.nextDouble() - 0.5) * 0.55; // ±约15度
                g.setColor(COLORS[random.nextInt(COLORS.length)]);
                g.rotate(theta, x, HEIGHT / 2f);
                g.drawString(String.valueOf(code.charAt(i)), x, y);
                g.rotate(-theta, x, HEIGHT / 2f);
            }
        } finally {
            g.dispose();
        }

        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", bos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bos.toByteArray());
        } catch (IOException e) {
            throw new BusinessException("验证码图片生成失败，请刷新重试");
        }
    }
}
