import 'package:flutter_test/flutter_test.dart';
import 'package:mindmapper_flutter/controller/mind_map_controller.dart';
import 'package:flutter/material.dart';

void main() {
  group('MindMapController Tests', () {
    late MindMapController controller;

    setUp(() {
      controller = MindMapController();
      // Clear demo data for fresh tests (if possible, or just ignore it)
      // Since _loadDemoData is called in constructor, we might want to clear it manually
      // or just add new elements.
      // Let's rely on adding new elements to test specific logic.
    });

    test('Initial state should have demo data', () {
      expect(controller.model.elements, isNotEmpty);
      expect(controller.model.connections, isNotEmpty);
    });

    test('addBubble should create a new element and select it', () {
      final initialCount = controller.model.elements.length;
      controller.addBubble(100, 200);

      expect(controller.model.elements.length, initialCount + 1);
      final newElement = controller.model.elements.last;
      expect(newElement.x, 100);
      expect(newElement.y, 200);
      expect(controller.selectedElementId, newElement.id);
    });

    test('updateElementPosition should move the element', () {
      // Use existing element or add new one
      controller.addBubble(0, 0);
      final id = controller.model.elements.last.id;

      controller.updateElementPosition(id, 50, 50);

      final updated = controller.model.elements.firstWhere((e) => e.id == id);
      expect(updated.x, 50);
      expect(updated.y, 50);
    });

    test('updateElementText should change the text', () {
      controller.addBubble(0, 0);
      final id = controller.model.elements.last.id;

      controller.updateElementText(id, 'Updated Text');

      final updated = controller.model.elements.firstWhere((e) => e.id == id);
      expect(updated.text, 'Updated Text');
    });

    test('Temp connection logic should update state', () {
      expect(controller.tempConnectionStart, isNull);
      expect(controller.tempConnectionEnd, isNull);

      controller.updateTempConnection(
        const Offset(0, 0),
        const Offset(100, 100),
      );

      expect(controller.tempConnectionStart, const Offset(0, 0));
      expect(controller.tempConnectionEnd, const Offset(100, 100));
    });

    test('addConnection should create a connection between two nodes', () {
      controller.addBubble(0, 0);
      final fromId = controller.model.elements.last.id;

      controller.addBubble(100, 100);
      final toId = controller.model.elements.last.id;

      controller.addConnection(fromId, toId);

      // Check if connection exists
      final hasConnection = controller.model.connections.any(
        (c) => c.from == fromId && c.to == toId,
      );
      expect(hasConnection, isTrue);
    });

    test('addConnection should not duplicate connections', () {
      controller.addBubble(0, 0);
      final fromId = controller.model.elements.last.id;

      controller.addBubble(100, 100);
      final toId = controller.model.elements.last.id;

      controller.addConnection(fromId, toId);
      final countBefore = controller.model.connections.length;

      // Try adding again
      controller.addConnection(fromId, toId);
      expect(controller.model.connections.length, countBefore);

      // Try reverse
      controller.addConnection(toId, fromId);
      expect(controller.model.connections.length, countBefore);
    });
  });
}
