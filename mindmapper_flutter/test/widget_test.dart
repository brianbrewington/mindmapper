// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindmapper_flutter/main.dart';

void main() {
  testWidgets('MindMapper basic rendering smoke test', (
    WidgetTester tester,
  ) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MindMapperApp());

    // Verify that our demo data is displayed
    expect(find.text('Mind Mapper Demo'), findsOneWidget);
    expect(find.text('Scenes'), findsOneWidget);
    expect(find.text('Persistence'), findsOneWidget);

    // Verify counter is gone
    expect(find.text('0'), findsNothing);
    expect(find.byIcon(Icons.add), findsNothing);
  });
}
