import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../controller/mind_map_controller.dart';
import '../model/mind_map_model.dart';
import 'mind_map_painter.dart';
import '../constants.dart';
import 'dart:math' as math;

/// Main Screen for the Mind Map.
///
/// Handles:
/// - Infinite Canvas (InteractiveViewer)
/// - Element Painting & Interaction
/// - Gesture Arbitration (Canvas Pan vs Bubble Drag)
class MindMapScreen extends StatefulWidget {
  const MindMapScreen({super.key});

  @override
  State<MindMapScreen> createState() => _MindMapScreenState();
}

class _MindMapScreenState extends State<MindMapScreen> {
  final MindMapController _controller = MindMapController();
  final TransformationController _transformationController =
      TransformationController();
  final FocusNode _focusNode = FocusNode();

  // Canvas layout constants
  static const double containerCenter = AppConstants.canvasCenter;

  // Interaction State
  bool _panEnabled = true;

  @override
  void initState() {
    super.initState();
    // Initial zoom to fit content
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _zoomToFit();
    });
  }

  /// Calculates the bounds of the content and adjusts the view to fit it.
  void _zoomToFit() {
    // We use the model's computeBounds method.
    final bounds = _controller.model.computeBounds();
    if (bounds == Rect.zero) return;

    final size = MediaQuery.of(context).size;
    final contentWidth = bounds.width;
    final contentHeight = bounds.height;

    // Determine scale to fit, clamped for usability
    final scaleX = size.width / contentWidth;
    final scaleY = size.height / contentHeight;
    final scale = math.min(scaleX, scaleY).clamp(0.1, 4.0).toDouble();

    // Center point of the content relative to the infinite canvas origin
    final contentCenterX = bounds.center.dx;
    final contentCenterY = bounds.center.dy;

    // Viewport centering math
    final dx = (containerCenter + contentCenterX);
    final dy = (containerCenter + contentCenterY);

    final matrix = Matrix4.identity()
      ..translate(size.width / 2, size.height / 2)
      ..scale(scale)
      ..translate(-dx, -dy);

    _transformationController.value = matrix;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _zoomToFit,
        tooltip: 'Zoom to Fit',
        backgroundColor: Colors.amber,
        foregroundColor: Colors.black,
        elevation: 10,
        child: const Icon(Icons.crop_free),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text('Mind Mapper Flutter'),
      backgroundColor: Colors.blueGrey,
      actions: [
        IconButton(
          icon: const Icon(Icons.undo),
          onPressed: _controller.canUndo ? () => _controller.undo() : null,
          tooltip: 'Undo',
        ),
        IconButton(
          icon: const Icon(Icons.redo),
          onPressed: _controller.canRedo ? () => _controller.redo() : null,
          tooltip: 'Redo',
        ),
        IconButton(
          icon: const Icon(Icons.save),
          onPressed: () async {
            final path = await _controller.saveToFile();
            if (path != null && mounted) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text('Saved to $path')));
            }
          },
          tooltip: 'Save',
        ),
        IconButton(
          icon: const Icon(Icons.folder_open),
          onPressed: () => _controller.loadFromFile(),
          tooltip: 'Load',
        ),
        const SizedBox(width: 10),
      ],
    );
  }

  Widget _buildBody() {
    return GestureDetector(
      onTap: () {
        // Ensure keyboard focus works for shortcuts
        FocusScope.of(context).requestFocus(_focusNode);
      },
      child: KeyboardListener(
        focusNode: _focusNode,
        autofocus: true,
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.keyZ) {
            _zoomToFit();
          }
        },
        child: ListenableBuilder(
          listenable: _controller,
          builder: (context, child) {
            return InteractiveViewer(
              transformationController: _transformationController,
              boundaryMargin: const EdgeInsets.all(double.infinity),
              minScale: 0.1,
              maxScale: 4.0,
              panEnabled: _panEnabled,
              child: SizedBox(
                width: AppConstants.canvasSize,
                height: AppConstants.canvasSize,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // --- Layer 0: Background Tap Detection ---
                    Positioned.fill(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTapUp: (details) {
                          print("Background Tap at ${details.localPosition}");
                          final local = details.localPosition;
                          _showAddBubbleDialog(
                            local.dx - containerCenter,
                            local.dy - containerCenter,
                          );
                        },
                        child: Container(
                          color: Colors.white, // Needs color to hit-test
                        ),
                      ),
                    ),

                    // --- Debug: Center Marker ---
                    Positioned(
                      left: containerCenter - 25,
                      top: containerCenter - 25,
                      width: 50,
                      height: 50,
                      child: IgnorePointer(
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Colors.red.withOpacity(0.5),
                            ),
                          ),
                          child: const Center(
                            child: Text(
                              "ORIGIN",
                              style: TextStyle(fontSize: 8, color: Colors.grey),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // --- Layer 1: Connections ---
                    Positioned.fill(
                      child: IgnorePointer(
                        child: CustomPaint(
                          painter: MindMapConnectionsPainter(_controller.model),
                        ),
                      ),
                    ),

                    // --- Layer 2: Elements ---
                    ..._controller.model.elements.map(
                      (e) => _buildElementPositioned(e),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildElementPositioned(MindMapElement e) {
    return Positioned(
      left: containerCenter + e.x - (e.width / 2),
      top: containerCenter + e.y - (e.height / 2),
      width: e.width,
      height: e.height,
      child: _buildElementWidget(e),
    );
  }

  Widget _buildElementWidget(MindMapElement e) {
    final isSelected = _controller.selectedElementId == e.id;

    // We use a Listener to inhibit the InteractiveViewer pan
    // as soon as the user touches a bubble.
    return Listener(
      onPointerDown: (_) {
        print("Pointer Down on Bubble ${e.id}");
        setState(() {
          _panEnabled = false;
        });
      },
      onPointerUp: (_) {
        print("Pointer Up on Bubble ${e.id}");
        setState(() {
          _panEnabled = true;
        });
        // Save state on drag end (approximate)
        _controller.model.saveState();
      },
      onPointerCancel: (_) {
        setState(() {
          _panEnabled = true;
        });
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          print("Tap on Bubble ${e.id}");
          _controller.selectElement(e.id);
        },
        onPanUpdate: (details) {
          // Manually calculate drag delta adjusting for zoom scale
          final matrix = _transformationController.value;
          final scale = matrix.getMaxScaleOnAxis();
          final s = scale == 0 ? 1.0 : scale;

          _controller.updateElementPosition(
            e.id,
            e.x + (details.delta.dx / s),
            e.y + (details.delta.dy / s),
          );
        },
        onLongPress: () {
          print("Long Press on Bubble ${e.id}");
          _showElementContextMenu(e);
        },
        child: Container(
          decoration: BoxDecoration(
            color: _parseColor(e.color),
            borderRadius: BorderRadius.circular(e.height / 2),
            border: Border.all(
              color: isSelected ? Colors.blueAccent : Colors.black54,
              width: isSelected ? 4 : 2,
            ),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 4,
                offset: Offset(2, 2),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Text(
            e.text,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  // --- Dialogs & Helpers ---

  void _showAddBubbleDialog(double x, double y) {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('New Bubble'),
          content: TextField(
            controller: textController,
            autofocus: true,
            maxLines: null,
            decoration: const InputDecoration(hintText: 'Enter text...'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (textController.text.isNotEmpty) {
                  _controller.addBubble(x, y, text: textController.text);
                }
                Navigator.of(context).pop();
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  void _showEditDialog(MindMapElement e) {
    final textController = TextEditingController(text: e.text);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Edit Text'),
          content: TextField(
            controller: textController,
            autofocus: true,
            maxLines: null,
            decoration: const InputDecoration(hintText: 'Enter text...'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                _controller.updateElementText(e.id, textController.text);
                Navigator.of(context).pop();
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showElementContextMenu(MindMapElement e) async {
    await showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: Text('Edit: ${e.text}'),
          children: [
            SimpleDialogOption(
              onPressed: () {
                Navigator.pop(context);
                _showEditDialog(e);
              },
              child: const Row(
                children: [
                  Icon(Icons.edit),
                  SizedBox(width: 10),
                  Text('Edit Text'),
                ],
              ),
            ),
            SimpleDialogOption(
              onPressed: () {
                Navigator.pop(context);
                _showColorPicker(e);
              },
              child: const Row(
                children: [
                  Icon(Icons.color_lens),
                  SizedBox(width: 10),
                  Text('Change Color'),
                ],
              ),
            ),
            SimpleDialogOption(
              onPressed: () {
                Navigator.pop(context);
                _controller.deleteElement(e.id);
              },
              child: const Row(
                children: [
                  Icon(Icons.delete, color: Colors.red),
                  SizedBox(width: 10),
                  Text('Delete'),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  void _showColorPicker(MindMapElement e) {
    final colors = [
      '#FFFFFF',
      '#FFCDD2',
      '#C8E6C9',
      '#BBDEFB',
      '#FFF9C4',
      '#E1BEE7',
    ];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Pick Color'),
        content: Wrap(
          children: colors
              .map(
                (c) => GestureDetector(
                  onTap: () {
                    _controller.updateElementColor(e.id, c);
                    Navigator.pop(context);
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _parseColor(c),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    } else if (hex.length == 3) {
      hex = 'FF${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}';
    }
    return Color(int.parse(hex, radix: 16));
  }
}
