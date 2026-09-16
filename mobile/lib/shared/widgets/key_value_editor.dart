import 'package:flutter/material.dart';

class KeyValueEditor extends StatefulWidget {
  const KeyValueEditor(
      {super.key, required this.initial, required this.onChanged});

  final Map<String, dynamic> initial;
  final ValueChanged<Map<String, dynamic>> onChanged;

  @override
  State<KeyValueEditor> createState() => _KeyValueEditorState();
}

class _KeyValueEditorState extends State<KeyValueEditor> {
  late List<MapEntry<TextEditingController, TextEditingController>> _rows;

  @override
  void initState() {
    super.initState();
    _rows = widget.initial.entries
        .map((e) => MapEntry(
              TextEditingController(text: e.key),
              TextEditingController(text: e.value?.toString() ?? ''),
            ))
        .toList();
    if (_rows.isEmpty) _addRow();
  }

  void _addRow() {
    setState(() {
      _rows.add(MapEntry(TextEditingController(), TextEditingController()));
    });
  }

  void _removeRow(int index) {
    setState(() => _rows.removeAt(index));
    _emit();
  }

  void _emit() {
    final map = <String, dynamic>{};
    for (final row in _rows) {
      final key = row.key.text.trim();
      if (key.isNotEmpty) map[key] = row.value.text;
    }
    widget.onChanged(map);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < _rows.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _rows[i].key,
                    decoration: const InputDecoration(
                        labelText: 'Field', isDense: true),
                    onChanged: (_) => _emit(),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _rows[i].value,
                    decoration: const InputDecoration(
                        labelText: 'Value', isDense: true),
                    onChanged: (_) => _emit(),
                  ),
                ),
                IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: () => _removeRow(i)),
              ],
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: _addRow,
            icon: const Icon(Icons.add),
            label: const Text('Add field'),
          ),
        ),
      ],
    );
  }
}
