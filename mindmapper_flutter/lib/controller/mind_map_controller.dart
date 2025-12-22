import 'dart:convert';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../model/mind_map_model.dart';

class MindMapController extends ChangeNotifier {
  MindMapModel _model = MindMapModel(elements: [], connections: []);
  MindMapModel get model => _model;

  String? _selectedElementId;
  String? get selectedElementId => _selectedElementId;

  // For generating unique IDs
  int _idCounter = 0;

  // Temp connection state
  Offset? _tempConnectionStart;
  Offset? get tempConnectionStart => _tempConnectionStart;
  Offset? _tempConnectionEnd;
  Offset? get tempConnectionEnd => _tempConnectionEnd;

  MindMapController() {
    _loadDemoData();
    // Save initial state
    model.saveState();
  }

  void _loadDemoData() {
    _model = MindMapModel(
      elements: [
        MindMapElement(
          id: 'root',
          type: 'bubble',
          x: 0,
          y: 0,
          text: 'Mind Mapper Demo',
          width: 160,
          height: 80,
          color: '#82CAFA',
        ),
        MindMapElement(
          id: 'feature1',
          type: 'bubble',
          x: -200,
          y: 100,
          text: 'Scenes',
          width: 120,
          height: 60,
          color: '#87CEEB',
        ),
        MindMapElement(
          id: 'feature2',
          type: 'bubble',
          x: 0,
          y: 150,
          text: 'Persistence',
          width: 120,
          height: 60,
          color: '#87CEEB',
        ),
        MindMapElement(
          id: 'feature3',
          type: 'bubble',
          x: 200,
          y: 100,
          text: 'Connections',
          width: 120,
          height: 60,
          color: '#87CEEB',
        ),
      ],
      connections: [
        MindMapConnection(id: 'c1', from: 'root', to: 'feature1'),
        MindMapConnection(id: 'c2', from: 'root', to: 'feature2'),
        MindMapConnection(id: 'c3', from: 'root', to: 'feature3'),
      ],
    );
    notifyListeners();
  }

  void addBubble(double x, double y, {String text = 'New Idea'}) {
    _idCounter++;
    final newId = 'node_$_idCounter';
    final newElement = MindMapElement(
      id: newId,
      type: 'bubble',
      x: x,
      y: y,
      text: text,
      width: 120,
      height: 60,
      color: '#AABBCC', // Distinct color for new nodes
    );
    _model.elements.add(newElement);

    // Auto-select the new bubble
    selectElement(newId);
    model.saveState();
    notifyListeners();
  }

  void selectElement(String? id) {
    if (_selectedElementId != id) {
      _selectedElementId = id;
      notifyListeners();
    }
  }

  void updateElementPosition(String id, double x, double y) {
    final index = _model.elements.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _model.elements[index];
      _model.elements[index] = MindMapElement(
        id: old.id,
        type: old.type,
        x: x,
        y: y,
        text: old.text,
        width: old.width,
        height: old.height,
        color: old.color,
      );
      // We don't save state on every generic update, usually on drag end.
      notifyListeners();
    }
  }

  void updateElementText(String id, String text) {
    final index = _model.elements.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _model.elements[index];
      _model.elements[index] = MindMapElement(
        id: old.id,
        type: old.type,
        x: old.x,
        y: old.y,
        text: text,
        width: old.width,
        height: old.height,
        color: old.color,
      );
      model.saveState();
      notifyListeners();
    }
  }

  void updateElementColor(String id, String color) {
    final index = _model.elements.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _model.elements[index];
      _model.elements[index] = MindMapElement(
        id: old.id,
        type: old.type,
        x: old.x,
        y: old.y,
        text: old.text,
        width: old.width,
        height: old.height,
        color: color,
        fontSize: old.fontSize,
        font: old.font,
      );
      model.saveState();
      notifyListeners();
    }
  }

  void deleteElement(String id) {
    _model.elements.removeWhere((e) => e.id == id);
    _model.connections.removeWhere((c) => c.from == id || c.to == id);
    if (_selectedElementId == id) _selectedElementId = null;
    model.saveState();
    notifyListeners();
  }

  void updateTempConnection(Offset? start, Offset? end) {
    _tempConnectionStart = start;
    _tempConnectionEnd = end;
    notifyListeners();
  }

  void addConnection(String fromId, String toId) {
    final exists = _model.connections.any(
      (c) =>
          (c.from == fromId && c.to == toId) ||
          (c.from == toId && c.to == fromId),
    );

    if (!exists && fromId != toId) {
      _model.connections.add(
        MindMapConnection(
          id: 'conn_${DateTime.now().millisecondsSinceEpoch}',
          from: fromId,
          to: toId,
        ),
      );
      model.saveState();
      notifyListeners();
    }

    updateTempConnection(null, null);
  }

  // --- Undo / Redo ---

  /// Returns true if undo is possible.
  bool get canUndo => model.canUndo();

  /// Returns true if redo is possible.
  bool get canRedo => model.canRedo();

  /// Reverts the last action.
  void undo() {
    model.undo();
    notifyListeners();
  }

  /// Reapplies the previously undone action.
  void redo() {
    model.redo();
    notifyListeners();
  }

  // --- Persistence ---

  /// Saves the current mind map to a JSON file.
  ///
  /// Returns the path of the saved file if successful, or null if cancelled/failed.
  Future<String?> saveToFile() async {
    final jsonString = jsonEncode(model.toJson());
    final bytes = utf8.encode(jsonString);

    // Web only supports download via anchor usually, but FilePicker helps.
    String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Save Mind Map',
      fileName: 'mindmap.json',
      type: FileType.custom,
      allowedExtensions: ['json'],
      bytes: Uint8List.fromList(bytes),
    );

    if (outputFile != null) {
      print("Saved to $outputFile");
      return outputFile;
    }
    return null;
  }

  /// Loads a mind map from a user-selected JSON file.
  Future<void> loadFromFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );

    if (result != null) {
      String content;
      if (result.files.single.bytes != null) {
        content = utf8.decode(result.files.single.bytes!);
      } else {
        return;
      }

      try {
        final map = jsonDecode(content);
        final newModel = MindMapModel.fromJson(map);

        // Replace fully
        _model.elements.clear();
        _model.elements.addAll(newModel.elements);
        _model.connections.clear();
        _model.connections.addAll(newModel.connections);
        _model.version = newModel.version;

        // Save as new state
        model.saveState();

        notifyListeners();
      } catch (e) {
        print("Error parsing JSON: $e");
      }
    }
  }
}
