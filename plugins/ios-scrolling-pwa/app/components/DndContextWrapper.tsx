// @ts-nocheck
import React from 'react';
import {DndProvider} from 'react-dnd';
import KeyboardBackend, {isKeyboardDragTrigger} from 'react-dnd-accessible-backend';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {createTransition, MouseTransition, MultiBackend, TouchTransition} from 'react-dnd-multi-backend';
import {TouchBackend} from 'react-dnd-touch-backend';
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';

const KeyboardTransition = createTransition('keydown', (event: Event) => {
	if (!isKeyboardDragTrigger(event as KeyboardEvent)) return false;
	event.preventDefault();
	return true;
});

const TOUCH_DND_OPTIONS = {
	backends: [
		{
			id: 'html5',
			backend: HTML5Backend,
			transition: MouseTransition,
		},
		{
			id: 'touch',
			backend: TouchBackend,
			options: { enableMouseEvents: false },
			preview: true,
			transition: TouchTransition,
		},
		{
			id: 'keyboard',
			backend: KeyboardBackend,
			context: {window, document},
			preview: true,
			transition: KeyboardTransition,
		},
	],
};

const DndContextWrapper = ({ OriginalComponent, ...props }) => {
  return (
    <DndProvider backend={MultiBackend} options={TOUCH_DND_OPTIONS}>
      {props.children}
    </DndProvider>
  );
};

export default wrapComponent(DndContextWrapper);
