import * as React from 'react';
import type { Meta, StoryObj } from "@storybook/react";
//import {  ErrorAlert } from "..";
import  { SampleEl } from "..";
 



const meta: Meta<typeof SampleEl> = {
	component: SampleEl,
};

export default meta;
type Story = StoryObj<typeof SampleEl>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */



export const Single: Story = {
	render: () => <SampleEl />

};
