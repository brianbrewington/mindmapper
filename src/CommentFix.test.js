import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Comment System Fixes', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        // Mock DOM
        document.body.innerHTML = `
            <div id="app"></div>
            <button id="addBubbleBtn"></button>
            <div id="textInput" style="display:none;"></div>
            <div id="contextMenu"></div>
            <!-- Comment Modal Mocks -->
            <div id="commentModal" style="display:none;">
                <div id="commentDisplay"></div>
                <textarea id="commentEditInput" style="display:none;"></textarea>
                <button id="editCommentBtn"></button>
                <button id="saveCommentBtn" style="display:none;"></button>
            </div>
        `;

        model = new MindMapModel();
        model.updateElement = vi.fn((id, props) => {
            const el = model.elements.find(e => e.id === id);
            if (el) Object.assign(el, props);
        });

        renderer = {
            draw: vi.fn(),
            canvas: document.createElement('canvas'),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should NOT overwrite text when saving a comment', () => {
        // Setup Bubble
        const bubble = { id: 'b1', type: 'bubble', text: 'Original Text', x: 0, y: 0 };
        model.elements.push(bubble);
        model.selectedElement = bubble; // Simulate selection

        // Simulate Flow: Right Click -> Comment (which sets up modal) -> Edit -> Save

        // 1. Manually trigger what "Action: Comment" does (simplified based on UIManager analysis)
        uiManager.commentTarget = bubble; // Context menu sets this

        // 2. Click Edit Button
        const editBtn = document.getElementById('editCommentBtn');
        const input = document.getElementById('commentEditInput');

        // Mock the listener logic for Edit button if it wasn't attached (it is attached in constructor)
        editBtn.click();

        // Check 1: Input should NOT have "Original Text" (unless there is no comment and we want it empty)
        // The bug was it loaded 'text'. We expect it to be empty or undefined if no comment exists.
        expect(input.value).not.toBe('Original Text');

        // 3. Enter Comment
        input.value = 'New Comment';

        // 4. Click Save
        const saveBtn = document.getElementById('saveCommentBtn');
        saveBtn.click();

        // Check 2: Model should update 'comment', NOT 'text'
        expect(bubble.text).toBe('Original Text');
        expect(bubble.comment).toBe('New Comment');

        // Verify updateElement call
        expect(model.updateElement).toHaveBeenCalledWith('b1', expect.objectContaining({ comment: 'New Comment' }));
        expect(model.updateElement).not.toHaveBeenCalledWith('b1', expect.objectContaining({ text: 'New Comment' }));
    });

    it('should edit existing comment correctly', () => {
        const bubble = { id: 'b2', type: 'bubble', text: 'Bubble 2', comment: 'Existing Comment', x: 0, y: 0 };
        model.elements.push(bubble);
        uiManager.commentTarget = bubble;

        // Click Edit
        document.getElementById('editCommentBtn').click();
        const input = document.getElementById('commentEditInput');

        // Should load existing comment
        expect(input.value).toBe('Existing Comment');

        // Optimize comment
        input.value = 'Updated Comment';
        document.getElementById('saveCommentBtn').click();

        expect(bubble.comment).toBe('Updated Comment');
        expect(bubble.text).toBe('Bubble 2');
    });

    it('should use commentTarget from context menu interaction instead of selectedElement', () => {
        const bubble1 = { id: 'b1', type: 'bubble', text: 'Selected', x: 0, y: 0 };
        const bubble2 = { id: 'b2', type: 'bubble', text: 'RightClicked', x: 100, y: 100 };
        model.elements.push(bubble1, bubble2);

        model.selectedElement = bubble1; // User selected Bubble 1

        // But right-clicked Bubble 2
        uiManager.showContextMenu({
            x: 100, y: 100,
            hit: { type: 'element', element: bubble2 }
        });

        // Click "Comment" in menu
        const menu = document.getElementById('contextMenu');
        const commentAction = Array.from(menu.children).find(el => el.textContent.includes('Comment'));
        commentAction.click();

        // uiManager.commentTarget should be bubble2
        expect(uiManager.commentTarget.id).toBe('b2');

        // Now save a comment
        document.getElementById('editCommentBtn').click();
        const input = document.getElementById('commentEditInput');
        input.value = 'Comment for B2';
        document.getElementById('saveCommentBtn').click();

        // Should update B2, NOT B1
        expect(bubble2.comment).toBe('Comment for B2');
        expect(bubble1.comment).toBeUndefined();
    });

    it('should allow adding comments to connections', () => {
        const c1 = { id: 'c1', from: 'b1', to: 'b2', type: 'connection' };
        model.connections.push(c1);

        // Mock connection hit
        uiManager.showContextMenu({
            x: 50, y: 50,
            hit: { type: 'connection', connection: c1 }
        });

        // Click Comment
        const menu = document.getElementById('contextMenu');
        const commentAction = Array.from(menu.children).find(el => el.textContent.includes('Comment'));
        expect(commentAction).toBeTruthy();
        commentAction.click();

        // Verify Target
        expect(uiManager.commentTarget).toBe(c1);

        // Edit & Save
        document.getElementById('editCommentBtn').click();
        const input = document.getElementById('commentEditInput');
        input.value = 'Connection Note';
        document.getElementById('saveCommentBtn').click();

        // Verify Model
        expect(c1.comment).toBe('Connection Note');
    });

    it('should show saved comment when re-opening context menu for connection', () => {
        // Real connections don't have type property by default (bug in model/usage in UI)
        const c1 = { id: 'c1', from: 'b1', to: 'b2' };
        model.connections.push(c1);

        // 1. Open Menu & Save Comment
        uiManager.showContextMenu({
            x: 50, y: 50,
            hit: { type: 'connection', connection: c1 } // hit object HAS type
        });
        document.getElementById('contextMenu').querySelector('[data-id="action-comment"]').click();

        document.getElementById('editCommentBtn').click();
        const input = document.getElementById('commentEditInput');
        input.value = 'Persistent Comment';
        document.getElementById('saveCommentBtn').click();

        // 2. Close Modal (Simulate)
        document.getElementById('commentModal').style.display = 'none';

        // 3. Open Menu AGAIN
        uiManager.showContextMenu({
            x: 50, y: 50,
            hit: { type: 'connection', connection: c1 }
        });
        document.getElementById('contextMenu').querySelector('[data-id="action-comment"]').click();

        // 4. Verify Display shows comment
        const display = document.getElementById('commentDisplay');
        expect(display.style.display).toBe('block');
        expect(display.textContent).toBe('Persistent Comment');
    });

    it('should allow adding links to connections', () => {
        const c1 = { id: 'c1', from: 'b1', to: 'b2', type: 'connection' };
        model.connections.push(c1);

        // Mock hit
        uiManager.showContextMenu({
            x: 50, y: 50,
            hit: { type: 'connection', connection: c1 }
        });

        // Click Link
        const menu = document.getElementById('contextMenu');
        const linkAction = Array.from(menu.children).find(el => el.textContent.includes('Link'));
        expect(linkAction).toBeTruthy();

        // Mock prompt
        vi.spyOn(window, 'prompt').mockReturnValue('http://example.com');

        linkAction.click();

        // Verify Model
        expect(c1.link).toBe('http://example.com');
    });
});
