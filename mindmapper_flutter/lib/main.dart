import 'package:flutter/material.dart';
import 'view/mind_map_screen.dart';

void main() {
  runApp(const MindMapperApp());
}

class MindMapperApp extends StatelessWidget {
  const MindMapperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mind Mapper',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.lightBlue),
        useMaterial3: true,
      ),
      home: const MindMapScreen(),
    );
  }
}
