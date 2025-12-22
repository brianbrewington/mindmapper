import 'package:flutter/material.dart';
import '../model/mind_map_model.dart';
import '../constants.dart';

class MindMapConnectionsPainter extends CustomPainter {
  final MindMapModel model;
  final Offset? tempStart;
  final Offset? tempEnd;

  MindMapConnectionsPainter(this.model, {this.tempStart, this.tempEnd});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final centerOffset = const Offset(
      AppConstants.canvasCenter,
      AppConstants.canvasCenter,
    );

    for (var conn in model.connections) {
      final from = model.elements.firstWhere(
        (e) => e.id == conn.from,
        orElse: () => MindMapElement(id: '', type: '', x: 0, y: 0),
      );
      final to = model.elements.firstWhere(
        (e) => e.id == conn.to,
        orElse: () => MindMapElement(id: '', type: '', x: 0, y: 0),
      );

      if (from.id.isEmpty || to.id.isEmpty) continue;

      final p1 = Offset(from.x, from.y) + centerOffset;
      final p2 = Offset(to.x, to.y) + centerOffset;

      // Draw quadratic bezier curve for smoother connections
      final path = Path();
      path.moveTo(p1.dx, p1.dy);

      path.lineTo(p2.dx, p2.dy); // Simple straight line first
      canvas.drawPath(path, paint);
    }

    // Draw temp connection if active
    if (tempStart != null && tempEnd != null) {
      final p1 = tempStart! + centerOffset;
      final p2 = tempEnd! + centerOffset;

      final tempPaint = Paint()
        ..color = Colors.blueAccent
        ..strokeWidth = 2.0
        ..style = PaintingStyle.stroke;

      // Dash effect could be added here, but solid for now is fine
      canvas.drawLine(p1, p2, tempPaint);
    }
  }

  @override
  bool shouldRepaint(MindMapConnectionsPainter oldDelegate) {
    return oldDelegate.model != model ||
        oldDelegate.tempStart != tempStart ||
        oldDelegate.tempEnd != tempEnd;
  }
}
