import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bundle Integrity', () => {
    it('should not contain literal </script> tags in PersistenceManager.js source', () => {
        // We read the actual source code of the file because that is what gets bundled/inlined.
        const filePath = path.resolve(__dirname, 'io/PersistenceManager.js');
        const content = fs.readFileSync(filePath, 'utf-8');

        // The sequence < / script > (without spaces) must NOT appear in the source code strings.
        // We allow it only if it is split or encoded.

        // We search for the literal sequence.
        // We exclude the regex check itself if we write it as a regex literal in this test!
        // So we construct the search string safely.
        const forbidden = '<' + '/script>';

        // Check if the file content includes the forbidden sequence
        // We assume the user hasn't written a comment containing it (comments are stripped by minifier, but safer to avoid even in comments if possible).

        // Ideally, we want to ensure no *string literal* contains it.
        // But a simple substring check is a good proxy.

        // Note: The previous fix attempt used '<' + '/script>'. 
        // If the test finds that, it's technically "safe" in source, but "unsafe" after minification.
        // So we specifically check for the usage of decodeURIComponent('%3C').

        expect(content).toContain("decodeURIComponent('%3C')");

        // We allow the forbidden string ONLY if it appears in a comment explaining why it's forbidden?
        // Or we just check that we are using the robust method.
        expect(content).not.toContain("'<'+'/script>'"); // Ensure we replaced the old fix
        expect(content).not.toContain("'</script>'");    // Ensure no literals
        expect(content).not.toContain('"</script>"');    // Ensure no double quote literals

        // Also ensure we don't match ourself!
        expect(content).not.toContain('<script id="mindmap-data">');
    });
});
