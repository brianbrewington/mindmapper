import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindmapper_flutter/model/mind_map_model.dart';

void main() {
  group('MindMapModel Serialization', () {
    test('should correctly parse demo_mindmap.json structure', () {
      final jsonStr = '''
      {
        "elements": [
          {
            "type": "bubble",
            "id": "root",
            "x": 0,
            "y": 0,
            "text": "Mind Mapper Demo",
            "radiusX": 80,
            "radiusY": 40,
            "color": "#82CAFA",
            "fontSize": 20,
            "font": "20px Poppins"
          }
        ],
        "connections": [],
        "version": "1.0"
      }
      ''';

      final Map<String, dynamic> jsonData = jsonDecode(jsonStr);
      final model = MindMapModel.fromJson(jsonData);

      expect(model.elements.length, 1);
      final root = model.elements.first;
      expect(root.width, 160.0); // radiusX * 2
    });

    test('should round-trip JSON correctly', () {
      final element = MindMapElement(
        id: 'e1',
        type: 'bubble',
        x: 10,
        y: 20,
        text: 'Test',
        width: 100,
        height: 50,
      );

      final model = MindMapModel(elements: [element], connections: []);

      final json = model.toJson();
      final model2 = MindMapModel.fromJson(json);

      expect(model2.elements.first.id, element.id);
      expect(model2.elements.first.width, element.width);
    });
  });

  group('MindMapModel History', () {
    test('Should save state and undo/redo', () {
      final model = MindMapModel(elements: [], connections: []);
      model.saveState(); // State 0 (empty)

      model.elements.add(
        MindMapElement(id: '1', type: 'b', x: 0, y: 0, width: 10, height: 10),
      );
      model.saveState(); // State 1 (1 element)

      expect(model.canUndo(), true);
      expect(model.canRedo(), false);

      model.undo(); // Back to State 0
      expect(model.elements.isEmpty, true);
      expect(model.canRedo(), true);

      model.redo(); // Back to State 1
      expect(model.elements.length, 1);
    });

    test('Should truncate history on new change after undo', () {
      final model = MindMapModel(elements: [], connections: []);
      model.saveState(); // 0

      model.elements.add(
        MindMapElement(id: '1', type: 'b', x: 0, y: 0, width: 10, height: 10),
      );
      model.saveState(); // 1

      model.undo(); // Back to 0

      // New change
      model.elements.add(
        MindMapElement(id: '2', type: 'b', x: 10, y: 10, width: 10, height: 10),
      );
      model.saveState(); // New 1

      expect(model.canRedo(), false); // Old 1 should be gone

      model.undo();
      expect(model.elements.isEmpty, true);

      model.redo();
      expect(model.elements.first.id, '2'); // Should be the new element
    });
  });
}
