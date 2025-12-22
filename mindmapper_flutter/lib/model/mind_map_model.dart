import 'dart:convert';
import 'dart:ui';

class MindMapElement {
  String id;
  String type; // 'bubble', 'text', 'image'
  double x;
  double y;
  String text;
  double width; // mapped from radiusX * 2 for bubbles
  double height; // mapped from radiusY * 2 for bubbles
  String color;
  double fontSize;
  String font;

  MindMapElement({
    required this.id,
    required this.type,
    required this.x,
    required this.y,
    this.text = '',
    this.width = 100,
    this.height = 50,
    this.color = '#FFFFFF',
    this.fontSize = 14,
    this.font = '14px Poppins',
  });

  factory MindMapElement.fromJson(Map<String, dynamic> json) {
    // Handle specific logic for 'bubble' type radius -> width/height mapping if necessary
    // In JS: radiusX, radiusY. We'll map them to width/height for standard Flutter Rect usage
    double w = 100;
    double h = 50;

    if (json.containsKey('radiusX')) {
      w = (json['radiusX'] as num).toDouble() * 2;
    } else if (json.containsKey('width')) {
      w = (json['width'] as num).toDouble();
    }

    if (json.containsKey('radiusY')) {
      h = (json['radiusY'] as num).toDouble() * 2;
    } else if (json.containsKey('height')) {
      h = (json['height'] as num).toDouble();
    }

    return MindMapElement(
      id: json['id'] as String,
      type: json['type'] as String,
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      text: json['text'] as String? ?? '',
      width: w,
      height: h,
      color: json['color'] as String? ?? '#FFFFFF',
      fontSize: (json['fontSize'] as num?)?.toDouble() ?? 14.0,
      font: json['font'] as String? ?? '14px Poppins',
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'id': id,
      'type': type,
      'x': x,
      'y': y,
      'text': text,
      'color': color,
      'fontSize': fontSize,
      'font': font,
    };

    // Export radius for compatibility if it's a bubble, or width/height generic
    if (type == 'bubble') {
      data['radiusX'] = width / 2;
      data['radiusY'] = height / 2;
    } else {
      data['width'] = width;
      data['height'] = height;
    }

    return data;
  }
}

class MindMapConnection {
  String id;
  String from;
  String to;
  double weight;

  MindMapConnection({
    required this.id,
    required this.from,
    required this.to,
    this.weight = 2.0,
  });

  factory MindMapConnection.fromJson(Map<String, dynamic> json) {
    return MindMapConnection(
      id: json['id'] as String,
      from: json['from'] as String,
      to: json['to'] as String,
      weight: (json['weight'] as num?)?.toDouble() ?? 2.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'from': from, 'to': to, 'weight': weight};
  }
}

class MindMapModel {
  List<MindMapElement> elements;
  List<MindMapConnection> connections;
  String version;

  MindMapModel({
    required this.elements,
    required this.connections,
    this.version = '1.0',
  });

  factory MindMapModel.fromJson(Map<String, dynamic> json) {
    var elemsJson = json['elements'] as List? ?? [];
    var connsJson = json['connections'] as List? ?? [];

    List<MindMapElement> elems = elemsJson
        .map((e) => MindMapElement.fromJson(e as Map<String, dynamic>))
        .toList();

    List<MindMapConnection> conns = connsJson
        .map((e) => MindMapConnection.fromJson(e as Map<String, dynamic>))
        .toList();

    return MindMapModel(
      elements: elems,
      connections: conns,
      version: json['version'] as String? ?? '1.0',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'elements': elements.map((e) => e.toJson()).toList(),
      'connections': connections.map((c) => c.toJson()).toList(),
      'version': version,
      'scenes': [], // Placeholder for now
    };
  }

  // History Management
  List<String> _history = [];
  int _historyIndex = -1;

  /// Saves the current state to the history stack.
  ///
  /// If the current index is not at the end of the history (i.e. we have undone some actions),
  /// all future actions are discarded.
  void saveState() {
    // If we are in the middle of the history (undone some steps),
    // remove all future steps before saving new state
    if (_historyIndex < _history.length - 1) {
      _history.removeRange(_historyIndex + 1, _history.length);
    }

    final jsonState = jsonEncode(toJson());

    // Avoid duplicates
    if (_history.isNotEmpty && _history.last == jsonState) return;

    _history.add(jsonState);
    _historyIndex++;

    // Optional: Limit history size
    if (_history.length > 50) {
      _history.removeAt(0);
      _historyIndex--;
    }
  }

  /// Returns true if there are actions to undo.
  bool canUndo() => _historyIndex > 0;

  /// Returns true if there are actions to redo.
  bool canRedo() => _historyIndex < _history.length - 1;

  /// Reverts the model to the previous state in history.
  void undo() {
    if (!canUndo()) return;
    _historyIndex--;
    _restoreState(_history[_historyIndex]);
  }

  /// Reapplies the next state in history.
  void redo() {
    if (!canRedo()) return;
    _historyIndex++;
    _restoreState(_history[_historyIndex]);
  }

  void _restoreState(String jsonState) {
    final map = jsonDecode(jsonState);
    final buffer = MindMapModel.fromJson(map);

    // Update data without breaking references if possible,
    // but easier to just replace lists.
    elements.clear();
    elements.addAll(buffer.elements);

    connections.clear();
    connections.addAll(buffer.connections);

    version = buffer.version;
  }

  /// Computes the bounding box of all elements in the mind map.
  /// Returns [Rect.zero] if there are no elements.
  /// Adds a padding of 50.0 around the bounds.
  Rect computeBounds() {
    if (elements.isEmpty) return Rect.zero;

    double minX = double.infinity;
    double minY = double.infinity;
    double maxX = double.negativeInfinity;
    double maxY = double.negativeInfinity;

    for (var e in elements) {
      final halfW = e.width / 2;
      final halfH = e.height / 2;
      if ((e.x - halfW) < minX) minX = e.x - halfW;
      if ((e.y - halfH) < minY) minY = e.y - halfH;
      if ((e.x + halfW) > maxX) maxX = e.x + halfW;
      if ((e.y + halfH) > maxY) maxY = e.y + halfH;
    }
    // Add padding
    const padding = 50.0;
    return Rect.fromLTRB(
      minX - padding,
      minY - padding,
      maxX + padding,
      maxY + padding,
    );
  }
}
